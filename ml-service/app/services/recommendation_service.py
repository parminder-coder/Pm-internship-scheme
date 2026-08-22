import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

from app.services.embedding_service import embedding_service


class RecommendationService:

    def __init__(self):
        self.df = pd.read_csv("data/internships.csv")

        # Handle missing values
        for column in ["JobTitles", "Skills", "Description"]:
            self.df[column] = (
                self.df[column]
                .fillna("")
                .astype(str)
            )

        # Create combined internship text
        self.df["combined_text"] = (
            "Job Title: " + self.df["JobTitles"] +
            ". Skills: " + self.df["Skills"] +
            ". Description: " + self.df["Description"]
        )

        # Create embeddings ONCE
        print("Creating internship embeddings...")
        self.internship_embeddings = (
            embedding_service.model.encode(
                self.df["combined_text"].tolist(),
                show_progress_bar=True
            )
        )
        print("Internship embeddings created.")

    def _generate_explanation(self, row, candidate) -> str:
        """Generate custom per-internship eligibility explanation matching candidate profile."""
        cand_skills = [s.strip().lower() for s in (candidate.skills or []) if s and str(s).strip()]
        job_skills = [s.strip() for s in str(row.get("Skills", "")).split(",") if s.strip()]

        matched = []
        for js in job_skills:
            js_lower = js.lower()
            if any(cs in js_lower or js_lower in cs for cs in cand_skills):
                matched.append(js)

        if matched:
            top_matched = ", ".join(dict.fromkeys(matched[:3]))
            return f"You are eligible for this internship because your skills in {top_matched} match this role's requirements and skill development goals."
        elif candidate.branch or candidate.education:
            edu_str = candidate.branch or candidate.education
            return f"You are eligible for this internship because your background in {edu_str} aligns with your interest profile and skill development goals."
        elif candidate.preferredJobRole:
            return f"You are eligible for this internship because it matches your target {candidate.preferredJobRole} role and skill development goals."
        else:
            return "You are eligible for this internship because it matches your interest profile and skill development goals."

    def _generate_improvements(self, row, candidate) -> str:
        """Generate specific resume improvement advice by identifying missing target skills."""
        cand_skills = [s.strip().lower() for s in (candidate.skills or []) if s and str(s).strip()]
        job_skills = [s.strip() for s in str(row.get("Skills", "")).split(",") if s.strip()]

        missing = []
        for js in job_skills:
            js_lower = js.lower()
            if not any(cs in js_lower or js_lower in cs for cs in cand_skills):
                missing.append(js)

        if missing:
            top_missing = ", ".join(dict.fromkeys(missing[:3]))
            return f"Add {top_missing} to your resume to boost your match score for this position."
        return "Your technical skills align well with this role. Highlight relevant project links in your resume."

    def recommend(self, candidate):
        candidate_text = (
            "Skills: " + ", ".join(candidate.skills or []) +
            ". Preferred Job Role: " + (candidate.preferredJobRole or "") +
            ". Preferred Domain: " + (candidate.preferredDomain or "") +
            ". Education: " + (candidate.education or "") +
            ". Branch: " + (candidate.branch or "") +
            ". Experience: " + (candidate.experience or "") +
            ". Projects: " + ", ".join(candidate.projects or [])
        )

        # Candidate embedding
        candidate_embedding = embedding_service.create_embedding(candidate_text)

        # Similarity
        similarity_scores = cosine_similarity(
            candidate_embedding,
            self.internship_embeddings
        )[0]

        # Copy dataframe
        results = self.df.copy()
        results["similarity_score"] = similarity_scores * 100

        # Top 5
        results = results.sort_values("similarity_score", ascending=False).head(5)

        # Dynamic match explanation per internship
        explanations = [
            self._generate_explanation(row, candidate)
            for _, row in results.iterrows()
        ]
        results["matchExplanation"] = explanations

        # Dynamic resume improvement tips per internship
        improvements = [
            self._generate_improvements(row, candidate)
            for _, row in results.iterrows()
        ]
        results["suggestedImprovements"] = improvements

        return results
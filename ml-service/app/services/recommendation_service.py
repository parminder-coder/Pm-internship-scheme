from pathlib import Path

import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

from app.services.embedding_service import embedding_service


class RecommendationService:

    def __init__(self):

        dataset_path = Path(__file__).resolve().parents[2] / "data" / "internships.csv"
        self.df = pd.read_csv(dataset_path)

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

    def recommend(self, candidate):

        candidate_text = (
            "Skills: " + ", ".join(candidate.skills) +
            ". Preferred Job Role: " + candidate.preferredJobRole +
            ". Preferred Domain: " + candidate.preferredDomain +
            ". Education: " + candidate.education +
            ". Branch: " + candidate.branch +
            ". Experience: " + candidate.experience +
            ". Projects: " + ", ".join(candidate.projects)
        )

        # Candidate embedding
        candidate_embedding = (
            embedding_service.create_embedding(
                candidate_text
            )
        )

        # Similarity
        similarity_scores = cosine_similarity(
            candidate_embedding,
            self.internship_embeddings
        )[0]

        # Copy dataframe
        results = self.df.copy()

        results["similarity_score"] = (
            similarity_scores * 100
        )

        # Top 5
        results = (
            results
            .sort_values(
                "similarity_score",
                ascending=False
            )
            .head(5)
        )

        return results
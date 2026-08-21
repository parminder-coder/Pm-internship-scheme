import os
from typing import Any, Dict, Optional

from bson import ObjectId
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, PyMongoError


# =============================================================================
# CONFIGURATION
# =============================================================================

MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb://localhost:27017"
)

DB_NAME = os.getenv(
    "DB_NAME",
    "pm_internship_db"
)

COLLECTION_NAME = os.getenv(
    "COLLECTION_NAME",
    "candidates"
)


# =============================================================================
# MONGODB SERVICE
#
# READ ONLY
#
# This service ONLY reads candidate data.
# It does NOT save parser results.
# =============================================================================

class MongoDBService:

    def __init__(
        self,
        uri: str = MONGO_URI,
        db_name: str = DB_NAME
    ):
        self.uri = uri
        self.db_name = db_name

        self._client: Optional[MongoClient] = None
        self._db = None

    # -------------------------------------------------------------------------
    # DATABASE CONNECTION
    # -------------------------------------------------------------------------

    def get_database(self):

        if (
            self._client is not None
            and self._db is not None
        ):
            return self._db

        try:

            self._client = MongoClient(
                self.uri,
                serverSelectionTimeoutMS=3000
            )

            self._client.admin.command("ping")

            self._db = self._client[
                self.db_name
            ]

            return self._db

        except ConnectionFailure as exc:

            print(
                f"[!] MongoDB connection failed: {exc}"
            )

            self._client = None
            self._db = None

            return None

        except PyMongoError as exc:

            print(
                f"[!] MongoDB error: {exc}"
            )

            self._client = None
            self._db = None

            return None

    # -------------------------------------------------------------------------
    # GET LATEST CANDIDATE
    # -------------------------------------------------------------------------

    def get_latest_candidate(
        self
    ) -> Optional[Dict[str, Any]]:
        """
        Returns the latest candidate.

        Priority:
        1. created_at
        2. _id

        No database modification.
        """

        db = self.get_database()

        if db is None:
            return None

        try:

            collection = db[
                COLLECTION_NAME
            ]

            # -------------------------------------------------------------
            # Prefer created_at
            # -------------------------------------------------------------

            document = collection.find_one(
                {},
                sort=[
                    ("created_at", -1)
                ]
            )

            # -------------------------------------------------------------
            # Fallback to ObjectId ordering
            # -------------------------------------------------------------

            if document is None:

                document = collection.find_one(
                    {},
                    sort=[
                        ("_id", -1)
                    ]
                )

            if document is None:
                return None

            return self._make_json_safe(
                document
            )

        except PyMongoError as exc:

            print(
                f"[!] Failed to fetch latest candidate: {exc}"
            )

            return None

        except Exception as exc:

            print(
                f"[!] Unexpected error: {exc}"
            )

            return None

    # -------------------------------------------------------------------------
    # GET CANDIDATE BY ID
    # -------------------------------------------------------------------------

    def get_candidate_by_id(
        self,
        candidate_id: str
    ) -> Optional[Dict[str, Any]]:

        db = self.get_database()

        if db is None:
            return None

        try:

            collection = db[
                COLLECTION_NAME
            ]

            if ObjectId.is_valid(
                candidate_id
            ):

                query = {
                    "_id": ObjectId(
                        candidate_id
                    )
                }

            else:

                query = {
                    "_id": candidate_id
                }

            document = collection.find_one(
                query
            )

            if document is None:
                return None

            return self._make_json_safe(
                document
            )

        except PyMongoError as exc:

            print(
                f"[!] MongoDB error: {exc}"
            )

            return None

    # -------------------------------------------------------------------------
    # MAKE MONGODB DATA JSON SAFE
    # -------------------------------------------------------------------------

    def _make_json_safe(
        self,
        value: Any
    ) -> Any:

        if isinstance(
            value,
            ObjectId
        ):
            return str(value)

        if isinstance(
            value,
            dict
        ):

            return {
                str(key):
                    self._make_json_safe(item)

                for key, item
                in value.items()
            }

        if isinstance(
            value,
            list
        ):

            return [
                self._make_json_safe(item)
                for item in value
            ]

        if isinstance(
            value,
            tuple
        ):

            return [
                self._make_json_safe(item)
                for item in value
            ]

        return value

    # -------------------------------------------------------------------------
    # CLOSE CONNECTION
    # -------------------------------------------------------------------------

    def close(self):

        if self._client is not None:

            try:
                self._client.close()

            except Exception:
                pass

            self._client = None
            self._db = None


# =============================================================================
# SINGLETON
# =============================================================================

mongo_service = MongoDBService()

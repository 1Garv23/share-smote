import pytest
import requests
import io
import zipfile
import json
import time
from pathlib import Path
from PIL import Image
import numpy as np
from typing import Dict, List, Tuple


class APIConfig:
    BASE_URL = "http://localhost:8080"
    API_KEY = "1HKMRa7mBbJK6fytT_678lHisuUTwPpkte9DxvqjaNY"
    HEADERS = {"X-API-Key": API_KEY, "Content-Type": "application/json"}
    TIMEOUT = 120


@pytest.fixture(scope="session")
def api_config():
    return APIConfig()


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"X-API-Key": APIConfig.API_KEY})
    return s


@pytest.fixture
def cleanup_assets(session, api_config):
    created_assets = []

    yield created_assets

    for asset_id in created_assets:
        try:
            response = session.delete(
                f"{api_config.BASE_URL}/assets/{asset_id}", timeout=api_config.TIMEOUT
            )
        except Exception as e:
            print(f"Failed to cleanup asset {asset_id}: {e}")


def create_test_image(
    width: int = 256, height: int = 256, color: Tuple[int, int, int] = (255, 0, 0)
) -> bytes:
    img = Image.new("RGB", (width, height), color=color)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()


def create_test_zip(class_structure: Dict[str, int]) -> bytes:
    zip_buffer = io.BytesIO()

    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for class_name, count in class_structure.items():
            for i in range(count):
                color = (
                    (hash(class_name) * (i + 1)) % 256,
                    (hash(class_name) * (i + 2)) % 256,
                    (hash(class_name) * (i + 3)) % 256,
                )
                img_bytes = create_test_image(color=color)
                zf.writestr(f"{class_name}/image_{i}.png", img_bytes)

    zip_buffer.seek(0)
    return zip_buffer.getvalue()


def create_imbalanced_dataset_zip() -> bytes:
    return create_test_zip(
        {"majority_class": 50, "minority_class_1": 5, "minority_class_2": 3}
    )


class TestHealthAndAuth:
    def test_health_endpoint(self, session, api_config):
        response = session.get(
            f"{api_config.BASE_URL}/health", timeout=api_config.TIMEOUT
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "app" in data

    def test_authentication(self, api_config):
        response = requests.get(
            f"{api_config.BASE_URL}/assets/", timeout=api_config.TIMEOUT
        )
        assert response.status_code == 403

        response = requests.get(
            f"{api_config.BASE_URL}/assets/",
            headers={"X-API-Key": "invalid-key-123"},
            timeout=api_config.TIMEOUT,
        )
        assert response.status_code == 403


class TestUpload:
    def test_upload_valid_zip(self, session, api_config, cleanup_assets):
        zip_data = create_test_zip({"cat": 3, "dog": 3})

        files = {"file": ("test.zip", zip_data, "application/zip")}

        response = session.post(
            f"{api_config.BASE_URL}/upload/zip", files=files, timeout=api_config.TIMEOUT
        )

        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 6
        assert len(data["assets"]) == 6

        cleanup_assets.extend([asset["id"] for asset in data["assets"]])

        for asset in data["assets"]:
            assert "id" in asset
            assert "filename" in asset
            assert "url" in asset
            assert "label" in asset
            assert asset["label"] in ["cat", "dog"]

    def test_upload_invalid_file(self, session, api_config):
        files = {"file": ("test.txt", b"not a zip file", "text/plain")}

        response = session.post(
            f"{api_config.BASE_URL}/upload/zip", files=files, timeout=api_config.TIMEOUT
        )

        assert response.status_code == 400


class TestAssetManagement:
    def test_list_and_get_assets(self, session, api_config, cleanup_assets):
        zip_data = create_test_zip({"test_class": 2})
        files = {"file": ("test.zip", zip_data, "application/zip")}

        upload_response = session.post(
            f"{api_config.BASE_URL}/upload/zip", files=files, timeout=api_config.TIMEOUT
        )
        upload_data = upload_response.json()
        cleanup_assets.extend([asset["id"] for asset in upload_data["assets"]])

        response = session.get(
            f"{api_config.BASE_URL}/assets/", timeout=api_config.TIMEOUT
        )
        assert response.status_code == 200
        data = response.json()
        assert data["count"] >= 2

        asset_id = upload_data["assets"][0]["id"]
        response = session.get(
            f"{api_config.BASE_URL}/assets/{asset_id}", timeout=api_config.TIMEOUT
        )
        assert response.status_code == 200
        assert response.headers["Content-Type"].startswith("image/")

    def test_delete_asset(self, session, api_config):
        zip_data = create_test_zip({"test": 1})
        files = {"file": ("test.zip", zip_data, "application/zip")}

        upload_response = session.post(
            f"{api_config.BASE_URL}/upload/zip", files=files, timeout=api_config.TIMEOUT
        )
        asset_id = upload_response.json()["assets"][0]["id"]

        response = session.delete(
            f"{api_config.BASE_URL}/assets/{asset_id}", timeout=api_config.TIMEOUT
        )

        assert response.status_code == 200
        assert response.json()["status"] == "deleted"

        get_response = session.get(
            f"{api_config.BASE_URL}/assets/{asset_id}", timeout=api_config.TIMEOUT
        )
        assert get_response.status_code == 404


class TestParameters:
    def test_get_and_set_params(self, session, api_config):
        response = session.get(
            f"{api_config.BASE_URL}/params", timeout=api_config.TIMEOUT
        )
        assert response.status_code == 200

        params = {"data": {"kneighbors": 5, "targetratio": 0.8, "randomstate": 42}}

        response = session.post(
            f"{api_config.BASE_URL}/params", json=params, timeout=api_config.TIMEOUT
        )
        assert response.status_code == 200

        get_response = session.get(
            f"{api_config.BASE_URL}/params", timeout=api_config.TIMEOUT
        )
        assert get_response.status_code == 200
        data = get_response.json()
        assert data.get("kneighbors") == 5
        assert data.get("targetratio") == 0.8
        assert data.get("randomstate") == 42


class TestSMOTEAugmentation:
    def test_smote_basic_imbalanced_dataset(self, session, api_config, cleanup_assets):
        params = {"data": {"kneighbors": 5, "targetratio": 1.0, "randomstate": 42}}
        session.post(
            f"{api_config.BASE_URL}/params", json=params, timeout=api_config.TIMEOUT
        )

        zip_data = create_imbalanced_dataset_zip()
        files = {"file": ("imbalanced.zip", zip_data, "application/zip")}

        upload_response = session.post(
            f"{api_config.BASE_URL}/upload/zip", files=files, timeout=api_config.TIMEOUT
        )

        assert upload_response.status_code == 200
        uploaded_assets = upload_response.json()["assets"]
        cleanup_assets.extend([asset["id"] for asset in uploaded_assets])

        smote_request = {
            "images": [{"asset_id": asset["id"]} for asset in uploaded_assets],
            "options": {"horizontal_flip": False, "rotate_deg": None},
        }

        response = session.post(
            f"{api_config.BASE_URL}/augment/smote",
            json=smote_request,
            timeout=api_config.TIMEOUT,
        )

        assert response.status_code == 200
        assert response.headers["Content-Type"] == "application/zip"

        zip_content = io.BytesIO(response.content)
        with zipfile.ZipFile(zip_content, "r") as zf:
            assert "augmentation_metadata.json" in zf.namelist()

            metadata = json.loads(zf.read("augmentation_metadata.json"))
            assert "count" in metadata
            assert "synthetic_images" in metadata
            assert "metrics" in metadata

            assert metadata["count"] > 0
            assert len(metadata["synthetic_images"]) > 0

            metrics = metadata["metrics"]
            assert "classes" in metrics
            assert "quality_metrics" in metrics
            assert "average_quality" in metrics

    def test_smote_with_different_target_ratios(
        self, session, api_config, cleanup_assets
    ):
        target_ratios = [0.5, 1.0]

        for ratio in target_ratios:
            params = {
                "data": {"kneighbors": 5, "targetratio": ratio, "randomstate": 42}
            }
            session.post(
                f"{api_config.BASE_URL}/params", json=params, timeout=api_config.TIMEOUT
            )

            zip_data = create_test_zip({"majority": 20, "minority": 5})
            files = {"file": ("test.zip", zip_data, "application/zip")}

            upload_response = session.post(
                f"{api_config.BASE_URL}/upload/zip",
                files=files,
                timeout=api_config.TIMEOUT,
            )
            uploaded_assets = upload_response.json()["assets"]
            cleanup_assets.extend([asset["id"] for asset in uploaded_assets])

            smote_request = {
                "images": [{"asset_id": asset["id"]} for asset in uploaded_assets],
                "options": {"horizontal_flip": False, "rotate_deg": None},
            }

            response = session.post(
                f"{api_config.BASE_URL}/augment/smote",
                json=smote_request,
                timeout=api_config.TIMEOUT,
            )

            assert response.status_code == 200

    def test_smote_quality_metrics(self, session, api_config, cleanup_assets):
        zip_data = create_test_zip({"class_a": 20, "class_b": 5})
        files = {"file": ("test.zip", zip_data, "application/zip")}

        upload_response = session.post(
            f"{api_config.BASE_URL}/upload/zip", files=files, timeout=api_config.TIMEOUT
        )
        uploaded_assets = upload_response.json()["assets"]
        cleanup_assets.extend([asset["id"] for asset in uploaded_assets])

        smote_request = {
            "images": [{"asset_id": asset["id"]} for asset in uploaded_assets],
            "options": {"horizontal_flip": False, "rotate_deg": None},
        }

        response = session.post(
            f"{api_config.BASE_URL}/augment/smote",
            json=smote_request,
            timeout=api_config.TIMEOUT,
        )

        assert response.status_code == 200

        zip_content = io.BytesIO(response.content)
        with zipfile.ZipFile(zip_content, "r") as zf:
            metadata = json.loads(zf.read("augmentation_metadata.json"))

            metrics = metadata["metrics"]
            quality_metrics = metrics["quality_metrics"]

            assert len(quality_metrics) > 0

            for qm in quality_metrics:
                assert "synthetic_image" in qm
                assert "cosine_similarity" in qm
                assert "ssim" in qm
                assert 0 <= qm["cosine_similarity"] <= 1.005
                assert -1 <= qm["ssim"] <= 1

            avg_quality = metrics["average_quality"]
            assert "cosine_similarity" in avg_quality
            assert "ssim" in avg_quality

    def test_smote_multiclass_imbalance(self, session, api_config, cleanup_assets):
        zip_data = create_test_zip(
            {"class_1": 50, "class_2": 25, "class_3": 10, "class_4": 5}
        )
        files = {"file": ("multiclass.zip", zip_data, "application/zip")}

        upload_response = session.post(
            f"{api_config.BASE_URL}/upload/zip", files=files, timeout=api_config.TIMEOUT
        )
        uploaded_assets = upload_response.json()["assets"]
        cleanup_assets.extend([asset["id"] for asset in uploaded_assets])

        smote_request = {
            "images": [{"asset_id": asset["id"]} for asset in uploaded_assets],
            "options": {"horizontal_flip": False, "rotate_deg": None},
        }

        response = session.post(
            f"{api_config.BASE_URL}/augment/smote",
            json=smote_request,
            timeout=api_config.TIMEOUT,
        )

        assert response.status_code == 200

        zip_content = io.BytesIO(response.content)
        with zipfile.ZipFile(zip_content, "r") as zf:
            metadata = json.loads(zf.read("augmentation_metadata.json"))
            classes = metadata["metrics"]["classes"]

            for class_name, class_info in classes.items():
                if class_name in ["class_3", "class_4"]:
                    assert class_info["synthetic_count"] > 0

    def test_smote_insufficient_samples(self, session, api_config, cleanup_assets):
        zip_data = create_test_zip({"class_a": 1, "class_b": 1})
        files = {"file": ("insufficient.zip", zip_data, "application/zip")}

        upload_response = session.post(
            f"{api_config.BASE_URL}/upload/zip", files=files, timeout=api_config.TIMEOUT
        )
        uploaded_assets = upload_response.json()["assets"]
        cleanup_assets.extend([asset["id"] for asset in uploaded_assets])

        smote_request = {
            "images": [{"asset_id": asset["id"]} for asset in uploaded_assets],
            "options": {"horizontal_flip": False, "rotate_deg": None},
        }

        response = session.post(
            f"{api_config.BASE_URL}/augment/smote",
            json=smote_request,
            timeout=api_config.TIMEOUT,
        )

        assert response.status_code == 400


class TestIntegration:
    def test_complete_workflow(self, session, api_config, cleanup_assets):
        params = {"data": {"kneighbors": 5, "targetratio": 0.8, "randomstate": 42}}
        params_response = session.post(
            f"{api_config.BASE_URL}/params", json=params, timeout=api_config.TIMEOUT
        )
        assert params_response.status_code == 200

        zip_data = create_test_zip({"cat": 30, "dog": 8})
        files = {"file": ("dataset.zip", zip_data, "application/zip")}

        upload_response = session.post(
            f"{api_config.BASE_URL}/upload/zip", files=files, timeout=api_config.TIMEOUT
        )
        assert upload_response.status_code == 200
        uploaded_assets = upload_response.json()["assets"]
        cleanup_assets.extend([asset["id"] for asset in uploaded_assets])

        smote_request = {
            "images": [{"asset_id": asset["id"]} for asset in uploaded_assets],
            "options": {"horizontal_flip": False, "rotate_deg": None},
        }

        smote_response = session.post(
            f"{api_config.BASE_URL}/augment/smote",
            json=smote_request,
            timeout=api_config.TIMEOUT,
        )
        assert smote_response.status_code == 200

        zip_content = io.BytesIO(smote_response.content)
        with zipfile.ZipFile(zip_content, "r") as zf:
            metadata = json.loads(zf.read("augmentation_metadata.json"))

            assert metadata["count"] > 0

            classes = metadata["metrics"]["classes"]
            dog_count = classes["dog"]["total_count"]
            cat_count = classes["cat"]["total_count"]

            assert dog_count > 8

            ratio = dog_count / cat_count
            assert ratio > 0.5


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

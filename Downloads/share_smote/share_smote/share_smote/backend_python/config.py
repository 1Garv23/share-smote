from __future__ import annotations
from pathlib import Path
from typing import List, Set
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator


class Settings(BaseSettings):
    """
    Application configuration settings loaded from environment variables and .env file.

    Manages all configuration parameters including paths, security settings, upload limits,
    and CORS configuration. Settings are validated on initialization and provide computed
    properties for derived paths.
    """

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Application settings
    APPNAME: str = "image-service"
    ENV: str = Field(default="production")
    DATADIR: Path = Field(default=Path(".data"))

    # Security and CORS settings
    ALLOWEDHOSTS: List[str] = Field(default_factory=list)
    CORSORIGINS: List[str] = Field(default_factory=list)
    CORSALLOWCREDENTIALS: bool = True
    CORSALLOWMETHODS: List[str] = Field(
        default_factory=lambda: ["GET", "POST", "DELETE", "OPTIONS"]
    )
    CORSALLOWHEADERS: List[str] = Field(
        default_factory=lambda: [
            "Content-Type",
            "Authorization",
            "X-API-Key",
            "X-Request-ID",
        ]
    )

    # Upload limits
    UPLOADMAXFILES: int = 200
    UPLOADMAXUNZIPPEDMB: int = 500
    UPLOADMAXFILEMB: int = 50
    ALLOWEDIMAGEEXTS: Set[str] = Field(
        default_factory=lambda: {".jpg", ".jpeg", ".png", ".webp"}
    )

    # Image validation limits
    MINIMUM_IMAGE_RESOLUTION: int = 32
    MAXIMUM_IMAGE_DIMENSION: int = 10000
    MAXIMUM_IMAGE_PIXELS: int = 50000000

    # Directory and file names
    ASSETSDIRNAME: str = "assets"
    REGISTRYDIRNAME: str = "registry"
    REGISTRYFILENAME: str = "assetsindex.json"
    PARAMSFILENAME: str = "settings.json"

    # Logging configuration
    LOGLEVEL: str = "INFO"

    # Authentication settings
    SECRET_KEY: str = Field(default="CHANGE_THIS_IN_PRODUCTION_USE_ENV_VAR")
    API_KEY_HEADER: str = "X-API-Key"
    REQUIRE_AUTH: bool = Field(default=True)
    VALID_API_KEYS: Set[str] = Field(default_factory=set)

    @field_validator("DATADIR", mode="before")
    @classmethod
    def ensure_datadir(cls, v):
        """
        Ensure data directory and temporary subdirectory exist.

        Args:
            v: Path value from configuration

        Returns:
            Validated Path object with directories created
        """
        p = Path(v) if not isinstance(v, Path) else v
        p.mkdir(parents=True, exist_ok=True)
        (p / "tmp").mkdir(parents=True, exist_ok=True)
        return p

    @property
    def DATAPATH(self) -> Path:
        """
        Get absolute path to data directory.

        Returns:
            Resolved absolute Path to data directory
        """
        return Path(self.DATADIR).resolve()

    @property
    def ASSETSPATH(self) -> Path:
        """
        Get path to assets directory, creating it if necessary.

        Returns:
            Path to assets directory
        """
        p = self.DATAPATH / self.ASSETSDIRNAME
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def REGISTRYPATH(self) -> Path:
        """
        Get path to registry directory, creating it if necessary.

        Returns:
            Path to registry directory
        """
        p = self.DATAPATH / self.REGISTRYDIRNAME
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def REGISTRYFILE(self) -> Path:
        """
        Get path to asset registry index file.

        Returns:
            Path to assets index JSON file
        """
        return self.REGISTRYPATH / self.REGISTRYFILENAME

    @property
    def PARAMSFILE(self) -> Path:
        """
        Get path to SMOTE parameters file.

        Returns:
            Path to parameters JSON file
        """
        return self.DATAPATH / self.PARAMSFILENAME

    @property
    def UPLOAD_MAX_FILES(self) -> int:
        """
        Get maximum number of files allowed in upload.

        Returns:
            Maximum file count limit
        """
        return self.UPLOADMAXFILES

    @property
    def UPLOAD_MAX_UNZIPPED_MB(self) -> int:
        """
        Get maximum uncompressed size for ZIP uploads in megabytes.

        Returns:
            Maximum unzipped size in MB
        """
        return self.UPLOADMAXUNZIPPEDMB

    @property
    def UPLOAD_MAX_FILE_MB(self) -> int:
        """
        Get maximum individual file size in megabytes.

        Returns:
            Maximum file size in MB
        """
        return self.UPLOADMAXFILEMB

    @property
    def ALLOWED_IMAGE_EXTS(self) -> Set[str]:
        """
        Get set of allowed image file extensions.

        Returns:
            Set of allowed extensions (e.g., {'.jpg', '.png'})
        """
        return self.ALLOWEDIMAGEEXTS

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v):
        """
        Validate that SECRET_KEY is properly configured for production.

        Args:
            v: Secret key value from configuration

        Returns:
            Validated secret key

        Raises:
            ValueError: If secret key is default value or too short
        """
        if v == "CHANGE_THIS_IN_PRODUCTION_USE_ENV_VAR":
            raise ValueError(
                "SECRET_KEY must be changed from default value. "
                "Set SECRET_KEY environment variable with a secure random string."
            )
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long")
        return v

    @field_validator("VALID_API_KEYS")
    @classmethod
    def validate_api_keys(cls, v, info):
        """
        Validate that API keys are configured when authentication is required.

        Args:
            v: Set of valid API keys
            info: Validation context containing other field values

        Returns:
            Validated API keys set

        Raises:
            ValueError: If authentication is required but no keys are configured
        """
        require_auth = info.data.get("REQUIRE_AUTH", True)
        if require_auth and not v:
            raise ValueError(
                "VALID_API_KEYS cannot be empty when REQUIRE_AUTH is True. "
                "Set VALID_API_KEYS environment variable with comma-separated keys."
            )
        return v


# Global settings instance
settings = Settings()

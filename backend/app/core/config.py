from dotenv import load_dotenv
import os

load_dotenv()

SECRET_KEY = str(os.getenv("SECRET_KEY", "default_secret_key"))
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))
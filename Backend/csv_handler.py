import os
import uuid
from fastapi import UploadFile

CSV_DIR = "uploaded_csv"
os.makedirs(CSV_DIR, exist_ok=True)


def save_csv(file: UploadFile):
    file_id = str(uuid.uuid4())

    file_path = os.path.join(
        CSV_DIR,
        f"{file_id}_{file.filename}"
    )

    with open(file_path, "wb") as f:
        f.write(file.file.read())

    return file_path
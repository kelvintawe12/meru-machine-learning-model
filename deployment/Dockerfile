FROM rapidsai/rapidsai:25.10-cuda12.5-runtime-ubuntu22.04-py3.12

WORKDIR /app
COPY requirements_no_rapids.txt .
RUN pip install --no-cache-dir -r requirements_no_rapids.txt
COPY . /app/

EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]

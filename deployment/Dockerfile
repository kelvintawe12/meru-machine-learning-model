# Official RAPIDS 25.10 + CUDA 12.5 + Python 3.12 base image
# Already includes cudf, cuml, cugraph, rmm, raft, etc. → no need to pip install them
FROM rapidsai/base:25.10-cuda12-py3.12

# Avoid interactive prompts & fix permissions
ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Copy your original requirements.txt
COPY requirements.txt .

# Install ONLY the packages that are NOT already in the RAPIDS image
# (this automatically skips all the cu12/cudf/cuml lines because they are satisfied)
RUN pip install --no-cache-dir -r requirements.txt && \
    rm -rf /root/.cache/pip

# Copy your app code
COPY . /app/

EXPOSE 8000

# Run FastAPI
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]

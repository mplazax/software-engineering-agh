FROM python:3.11

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

RUN pip install poetry
RUN poetry config virtualenvs.in-project true

COPY pyproject.toml poetry.lock ./

RUN poetry install --no-root

COPY . .

EXPOSE 8000

ENV PATH="/app/.venv/bin:$PATH"

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
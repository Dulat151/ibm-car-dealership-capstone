import os
from urllib.parse import quote
import requests
from dotenv import load_dotenv

load_dotenv()

backend_url = os.getenv("backend_url", "http://localhost:3030").strip().rstrip("/") + "/"
sentiment_analyzer_url = os.getenv("sentiment_analyzer_url", "http://localhost:5000").strip().rstrip("/") + "/"

def get_request(endpoint, **kwargs):
    try:
        response = requests.get(backend_url + endpoint.lstrip("/"), params=kwargs, timeout=12)
        response.raise_for_status()
        return response.json()
    except (requests.RequestException, ValueError):
        return None

def analyze_review_sentiments(text):
    try:
        response = requests.get(sentiment_analyzer_url + "analyze/" + quote(str(text), safe=""), timeout=12)
        response.raise_for_status()
        return response.json()
    except (requests.RequestException, ValueError):
        return {"sentiment": "unavailable"}

def post_review(data_dict):
    try:
        response = requests.post(backend_url + "insert_review", json=data_dict, timeout=12)
        response.raise_for_status()
        return response.json()
    except (requests.RequestException, ValueError):
        return None

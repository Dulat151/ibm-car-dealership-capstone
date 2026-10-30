from flask import Flask, jsonify
from nltk.sentiment import SentimentIntensityAnalyzer
import nltk

nltk.download("vader_lexicon", quiet=True)
app = Flask(__name__)
sia = SentimentIntensityAnalyzer()

@app.get("/")
def home():
    return jsonify({"service": "Sentiment Analyzer", "status": "ok"})

@app.get("/analyze/<path:input_txt>")
def analyze_sentiment(input_txt):
    score = sia.polarity_scores(input_txt)["compound"]
    sentiment = "positive" if score >= 0.05 else "negative" if score <= -0.05 else "neutral"
    return jsonify({"sentiment": sentiment})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)

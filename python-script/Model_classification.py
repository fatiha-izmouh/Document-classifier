import torch
import mlflow
import time
import os
import nltk
from nltk.corpus import stopwords
import re
from transformers import RobertaTokenizer, RobertaForSequenceClassification

# Download NLTK stopwords
nltk.download('stopwords', quiet=True)
stop_words = set(stopwords.words('french') + stopwords.words('english'))

# Set device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src", "roberta_base_classifier"))
class DocumentClassifier:
    def __init__(self, model_path=model_path):
        
        # Set MLflow tracking URI and experiment
        mlflow.set_tracking_uri("file:///C:/developpement/document_classifier/python-script/mlruns")
        mlflow.set_experiment("Document_Classification")

        try:
            self.tokenizer = RobertaTokenizer.from_pretrained(model_path)
            self.model = RobertaForSequenceClassification.from_pretrained(model_path).to(device)
            self.model.eval()
            self.categories = list(self.model.config.id2label.values())  

            # Log model parameters to MLflow
            with mlflow.start_run(run_name=f"model_init_{int(time.time())}"):
                mlflow.log_param("model_name", "Roberta")
                mlflow.log_param("num_labels", len(self.categories))
                mlflow.log_param("device", str(device))
                mlflow.log_param("categories", self.categories)
        except Exception as e:
            print(f"Error loading model: {str(e)}")
            raise

    def preprocess_text(self, text):
        """
        Preprocess text: lowercase, remove special characters, and remove stopwords.
        """
        if not isinstance(text, str):
            return ""
        text = text.lower()
        text = re.sub(r'[^a-zA-Zà-ÿ\s]', '', text)
        text = ' '.join(text.split())
        text = ' '.join(word for word in text.split() if word not in stop_words)
        return text

    def classify(self, text: str, filename: str = "unknown") -> tuple[str, float]:
        """
        Classify the input text using Roberta.
        Args:
            text: The text to classify.
            filename: Name of the file being processed (for logging).
        Returns:
            Tuple of (classification label, confidence score).
        """
        with mlflow.start_run(run_name=f"classification_{filename}_{int(time.time())}", nested=True):
            # Log parameters
            mlflow.log_param("filename", filename)
            mlflow.log_param("text_length", len(text))

            try:
                start_time = time.time()
                text = self.preprocess_text(text)
                if not text.strip():
                    mlflow.log_param("error", "No valid text after preprocessing")
                    return "Inconnu", 0.0

                # Tokenize
                inputs = self.tokenizer(
                    text,
                    truncation=True,
                    padding=True,
                    max_length=512,
                    return_tensors="pt"
                ).to(device)

                # Classify
                with torch.no_grad():
                    outputs = self.model(**inputs)
                    logits = outputs.logits
                    probs = torch.softmax(logits, dim=-1)
                    pred_id = torch.argmax(probs, dim=-1).item()
                    confidence = probs[0, pred_id].item()
                    classification = self.categories[pred_id]

                # Log metrics
                processing_time = time.time() - start_time
                mlflow.log_metric("classification_confidence", confidence)
                mlflow.log_metric("processing_time_seconds", processing_time)

                # Log classification result as artifact
                result_text = f"Classification: {classification}\nConfidence: {confidence:.4f}"
                with open("classification_result.txt", "w", encoding="utf-8") as f:
                    f.write(result_text)
                mlflow.log_artifact("classification_result.txt")
                os.remove("classification_result.txt")

                mlflow.log_param("classification", classification)
                return classification, confidence
            except Exception as e:
                print(f"Error during classification: {str(e)}")
                mlflow.log_param("error", str(e))
                return "Inconnu", 0.0
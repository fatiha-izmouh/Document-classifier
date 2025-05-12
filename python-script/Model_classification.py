import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import mlflow
import time
import os

# Set device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Categories for classification
categories = ["Facture", "CV", "Article", "Contrat", "Proposition Commerciale", "Rapport", "Correspondance", "Autre"]

class DocumentClassifier:
    def __init__(self, model_path="distilbert-base-multilingual-cased"):
        """
        Initialize the DistilBERT classifier.
        Args:
            model_path: Path to the pre-trained or fine-tuned model.
        """
        # Set MLflow tracking URI and experiment for classification
        mlflow.set_tracking_uri("file:///C:/developpement/document_classifier/python-script/mlruns")
        mlflow.set_experiment("Document_Classification")

        try:
            self.tokenizer = AutoTokenizer.from_pretrained(model_path)
            self.model = AutoModelForSequenceClassification.from_pretrained(
                model_path, num_labels=len(categories)
            ).to(device)
            self.model.eval()

            # Log model parameters to MLflow
            with mlflow.start_run(run_name=f"model_init_{int(time.time())}"):
                mlflow.log_param("model_name", model_path)
                mlflow.log_param("num_labels", len(categories))
                mlflow.log_param("device", str(device))
        except Exception as e:
            print(f"Error loading model: {str(e)}")
            raise

    def classify(self, text: str, filename: str = "unknown") -> tuple[str, float]:
        """
        Classify the input text using DistilBERT.
        Args:
            text: The text to classify.
            filename: Name of the file being processed (for logging).
        Returns:
            Tuple of (classification label, confidence score).
        """
        # Start MLflow run for classification
        with mlflow.start_run(run_name=f"classification_{filename}_{int(time.time())}", nested=True):
            # Log parameters
            mlflow.log_param("filename", filename)
            mlflow.log_param("text_length", len(text))

            try:
                # Measure processing time
                start_time = time.time()

                # Chunk text to handle long inputs
                max_length = 512
                inputs = self.tokenizer(text, padding=False, truncation=False, return_tensors="pt")
                input_ids = inputs["input_ids"][0]
                attention_mask = inputs["attention_mask"][0]

                # Log whether chunking is needed
                mlflow.log_param("requires_chunking", len(input_ids) > max_length)

                if len(input_ids) <= max_length:
                    inputs = {
                        "input_ids": input_ids.unsqueeze(0).to(device),
                        "attention_mask": attention_mask.unsqueeze(0).to(device)
                    }
                    with torch.no_grad():
                        outputs = self.model(**inputs)
                        logits = outputs.logits
                        probs = torch.softmax(logits, dim=-1)
                        pred_id = torch.argmax(probs, dim=-1).item()
                        confidence = probs[0, pred_id].item()
                    classification = categories[pred_id]
                else:
                    # Chunking for long sequences
                    stride = 256  # Overlap to maintain context
                    all_probs = []
                    for i in range(0, len(input_ids), stride):
                        end = min(i + max_length, len(input_ids))
                        chunk_ids = input_ids[i:end].unsqueeze(0).to(device)
                        chunk_mask = attention_mask[i:end].unsqueeze(0).to(device)
                        with torch.no_grad():
                            outputs = self.model(input_ids=chunk_ids, attention_mask=chunk_mask)
                            logits = outputs.logits
                            probs = torch.softmax(logits, dim=-1)
                            all_probs.append(probs)

                    # Average probabilities across chunks
                    avg_probs = torch.mean(torch.stack(all_probs), dim=0)
                    pred_id = torch.argmax(avg_probs, dim=-1).item()
                    confidence = avg_probs[0, pred_id].item()
                    classification = categories[pred_id]

                # Calculate processing time
                processing_time = time.time() - start_time

                # Log metrics
                mlflow.log_metric("classification_confidence", confidence)
                mlflow.log_metric("processing_time_seconds", processing_time)

                # Log classification result as artifact
                result_text = f"Classification: {classification}\nConfidence: {confidence:.4f}"
                with open("classification_result.txt", "w", encoding="utf-8") as f:
                    f.write(result_text)
                mlflow.log_artifact("classification_result.txt")
                os.remove("classification_result.txt")

                # Log classification as parameter
                mlflow.log_param("classification", classification)

                return classification, confidence
            except Exception as e:
                print(f"Error during classification: {str(e)}")
                # Log error
                mlflow.log_param("error", str(e))
                return "Inconnu", 0.0
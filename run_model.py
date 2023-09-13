import joblib
import sys
from sklearn.feature_extraction.text import TfidfVectorizer

issue_body = sys.argv[1]

# Carica il modello 
loaded_model = joblib.load('lda_model.pkl')

# Carica il vettore TF-IDF utilizzato per l'addestramento 
tfidf_vectorizer = joblib.load('vectorizer.pkl')

def run_model(input_data):
    # Trasforma il testo in vettore TF-IDF
    input_tfidf = tfidf_vectorizer.transform(input_data)
    
    # Esegui il modello per ottenere la previsione
    prediction = loaded_model.predict(input_tfidf)
    return prediction[0]


prediction = run_model([issue_body])
print(prediction)
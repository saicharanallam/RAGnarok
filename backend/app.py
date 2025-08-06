from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "RAGnarok backend running"}), 200

# TODO: Add endpoints for file upload, chat, knowledge retrieval

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
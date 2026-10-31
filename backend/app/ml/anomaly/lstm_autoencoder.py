from typing import Tuple, Optional
import numpy as np
import torch
import torch.nn as nn


class Encoder(nn.Module):
    def __init__(self, input_dim: int = 3, hidden_dim: int = 32, latent_dim: int = 16):
        super(Encoder, self).__init__()
        self.lstm1 = nn.LSTM(input_dim, hidden_dim, batch_first=True)
        self.lstm2 = nn.LSTM(hidden_dim, latent_dim, batch_first=True)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x shape: (batch_size, seq_len, input_dim)
        out, _ = self.lstm1(x)
        out, (hn, _) = self.lstm2(out)
        # return the last hidden state as latent vector
        return hn[-1]  # shape: (batch_size, latent_dim)


class Decoder(nn.Module):
    def __init__(self, seq_len: int = 10, latent_dim: int = 16, hidden_dim: int = 32, output_dim: int = 3):
        super(Decoder, self).__init__()
        self.seq_len = seq_len
        self.lstm1 = nn.LSTM(latent_dim, hidden_dim, batch_first=True)
        self.lstm2 = nn.LSTM(hidden_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, output_dim)

    def forward(self, z: torch.Tensor) -> torch.Tensor:
        # z shape: (batch_size, latent_dim) -> repeat across sequence length
        repeated = z.unsqueeze(1).repeat(1, self.seq_len, 1)
        out, _ = self.lstm1(repeated)
        out, _ = self.lstm2(out)
        reconstruction = self.fc(out)  # shape: (batch_size, seq_len, output_dim)
        return reconstruction


class LSTMAutoencoder(nn.Module):
    """
    Deep PyTorch LSTM Autoencoder for temporal anomaly detection
    in vibration time-series telemetry.
    """

    def __init__(self, seq_len: int = 10, input_dim: int = 3, hidden_dim: int = 32, latent_dim: int = 16):
        super(LSTMAutoencoder, self).__init__()
        self.encoder = Encoder(input_dim=input_dim, hidden_dim=hidden_dim, latent_dim=latent_dim)
        self.decoder = Decoder(seq_len=seq_len, latent_dim=latent_dim, hidden_dim=hidden_dim, output_dim=input_dim)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        latent = self.encoder(x)
        reconstructed = self.decoder(latent)
        return reconstructed


class LSTMAnomalyDetector:
    """
    Inference interface for temporal vibration anomaly detection.
    Computes sequence reconstruction error; sequences exceeding the error threshold
    are classified as structural anomalies.
    """

    def __init__(self, seq_len: int = 10, input_dim: int = 3, threshold: float = 0.85):
        self.seq_len = seq_len
        self.input_dim = input_dim
        self.threshold = threshold
        self.model = LSTMAutoencoder(seq_len=seq_len, input_dim=input_dim)
        self.model.eval()

    def predict_sequence(self, sequence: np.ndarray) -> Tuple[bool, float, np.ndarray]:
        """
        Infers reconstruction error on a sequence (shape: seq_len x input_dim or 1 x seq_len x input_dim).
        Returns:
            - is_anomaly (bool)
            - mse_error (float)
            - reconstructed sequence (np.ndarray)
        """
        if sequence.ndim == 2:
            sequence = np.expand_dims(sequence, axis=0)

        tensor_seq = torch.tensor(sequence, dtype=torch.float32)

        with torch.no_grad():
            reconstructed_tensor = self.model(tensor_seq)
            mse_loss = nn.MSELoss()(tensor_seq, reconstructed_tensor).item()

        is_anomaly = bool(mse_loss > self.threshold)
        reconstructed_np = reconstructed_tensor.squeeze(0).numpy()

        return is_anomaly, round(float(mse_loss), 4), reconstructed_np


# Global singleton instance for LSTM pipeline integration
lstm_anomaly_detector = LSTMAnomalyDetector()

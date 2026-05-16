"""Constantes de domínio reutilizáveis."""

from typing import Final

# Critérios da redação ENEM — semeados automaticamente quando type='exam'.
# Cada tupla: (nome, pontuação máxima).
ENEM_REDACAO_CRITERIA: Final[list[tuple[str, int]]] = [
    ("Domínio da norma culta", 200),
    ("Compreensão do tema", 200),
    ("Argumentação", 200),
    ("Coesão e coerência", 200),
    ("Proposta de intervenção", 200),
]

"""Exceções HTTP comuns."""

from fastapi import HTTPException, status


class NotFoundError(HTTPException):
    def __init__(self, resource: str = "Recurso"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource} não encontrado",
        )


class ForbiddenError(HTTPException):
    def __init__(self, detail: str = "Você não tem permissão para esta ação"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class ConflictError(HTTPException):
    def __init__(self, detail: str = "Conflito"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)


class BadRequestError(HTTPException):
    def __init__(self, detail: str = "Requisição inválida"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


class GoneError(HTTPException):
    def __init__(self, detail: str = "Este recurso não está mais disponível"):
        super().__init__(status_code=status.HTTP_410_GONE, detail=detail)

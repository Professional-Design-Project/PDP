import asyncio
from dataclasses import dataclass

import jwt
from jwt import PyJWKClient

ALGORITHMS = ["ES256", "RS256"]


class InvalidToken(Exception):
    pass


@dataclass(frozen=True)
class Principal:
    user_id: str
    email: str | None


class SupabaseAuth:
    def __init__(self, project_url: str, jwks: PyJWKClient | None = None) -> None:
        base = project_url.rstrip("/")
        self.issuer = f"{base}/auth/v1"
        self.jwks = jwks or PyJWKClient(
            f"{self.issuer}/.well-known/jwks.json", cache_keys=True, lifespan=600
        )

    def _verify(self, token: str) -> Principal:
        try:
            key = self.jwks.get_signing_key_from_jwt(token)
            claims = jwt.decode(
                token,
                key.key,
                algorithms=ALGORITHMS,
                audience="authenticated",
                issuer=self.issuer,
                options={"require": ["exp", "iat", "sub", "aud", "iss"]},
            )
        except jwt.PyJWTError as error:
            raise InvalidToken from error
        if claims.get("role") != "authenticated" or claims.get("is_anonymous") is True:
            raise InvalidToken
        return Principal(user_id=claims["sub"], email=claims.get("email"))

    async def verify(self, token: str) -> Principal:
        return await asyncio.to_thread(self._verify, token)

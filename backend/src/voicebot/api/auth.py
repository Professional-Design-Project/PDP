from typing import Annotated

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from voicebot.infrastructure.auth import InvalidToken, Principal

user_bearer = HTTPBearer(auto_error=False, scheme_name="SupabaseUser")


class AuthenticationRequired(Exception):
    pass


async def current_user(
    request: Request,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(user_bearer)],
) -> Principal | None:
    auth = request.app.state.auth
    if auth is None:
        return None
    if credentials is None:
        raise AuthenticationRequired
    try:
        return await auth.verify(credentials.credentials)
    except InvalidToken as error:
        raise AuthenticationRequired from error


CurrentUser = Annotated[Principal | None, Depends(current_user)]

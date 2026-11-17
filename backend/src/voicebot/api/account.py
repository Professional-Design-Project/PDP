from fastapi import APIRouter, Request, Response

from voicebot.api.auth import AuthenticationRequired, CurrentUser
from voicebot.infrastructure.supabase_admin import AccountDeletionFailed

router = APIRouter(prefix="/account", tags=["account"])


@router.delete(
    "",
    status_code=204,
    summary="Delete the signed-in user's account and all of their data",
    description=(
        "Deletes the Supabase user. Practice sessions, transcripts, feedback and consents are "
        "removed with it by cascading foreign keys. Requires a signed-in user."
    ),
)
async def delete_account(request: Request, user: CurrentUser):
    if user is None:
        raise AuthenticationRequired
    admin = request.app.state.admin
    if admin is None:
        raise AccountDeletionFailed
    await admin.delete_user(user.user_id)
    return Response(status_code=204)

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class CoupleTenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.coupleId) {
      throw new ForbiddenException('Ban can ghep doi voi doi phuong de thuc hien thao tac nay.');
    }

    request.coupleId = user.coupleId;
    return true;
  }
}

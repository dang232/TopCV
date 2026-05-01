import { All, Controller, Inject, Req, Res, UseGuards } from '@nestjs/common';
import { RPCHandler } from '@orpc/server/node';
import { CORSPlugin } from '@orpc/server/plugins';
import type { NodeHttpRequest, NodeHttpResponse } from '@orpc/standard-server-node';

import { FormsRouterFactory } from './forms.router';
import type { AuthUser, OrpcContext } from '../../auth/auth.types';
import { KeycloakJwtAuthGuard } from '../../auth/keycloak/keycloak-jwt.guard';

type ReqWithUser = NodeHttpRequest & { user?: AuthUser | null };

@Controller('rpc')
@UseGuards(KeycloakJwtAuthGuard)
export class OrpcController {
  private readonly handler: RPCHandler<OrpcContext>;

  constructor(@Inject(FormsRouterFactory) routerFactory: FormsRouterFactory) {
    this.handler = new RPCHandler(routerFactory.create(), {
      plugins: [new CORSPlugin()],
    });
  }

  @All('*path')
  async handle(@Req() req: ReqWithUser, @Res() res: NodeHttpResponse): Promise<void> {
    const result = await this.handler.handle(req, res, {
      prefix: '/rpc',
      context: { user: req.user ?? null },
    });

    if (!result.matched) {
      res.statusCode = 404;
      res.end('Not found');
    }
  }
}

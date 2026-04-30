import { All, Controller, Inject, Req, Res } from '@nestjs/common';
import { RPCHandler } from '@orpc/server/node';
import { CORSPlugin } from '@orpc/server/plugins';
import type { NodeHttpRequest, NodeHttpResponse } from '@orpc/standard-server-node';

import { FormsRouterFactory } from './forms.router';

type OrpcContext = Record<never, never>;

@Controller('rpc')
export class OrpcController {
  private readonly handler: RPCHandler<OrpcContext>;

  constructor(@Inject(FormsRouterFactory) routerFactory: FormsRouterFactory) {
    this.handler = new RPCHandler(routerFactory.create(), {
      plugins: [new CORSPlugin()],
    });
  }

  @All('*path')
  async handle(@Req() req: NodeHttpRequest, @Res() res: NodeHttpResponse): Promise<void> {
    const result = await this.handler.handle(req, res, {
      prefix: '/rpc',
      context: {},
    });

    if (!result.matched) {
      res.statusCode = 404;
      res.end('Not found');
    }
  }
}

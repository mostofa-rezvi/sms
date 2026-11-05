import { Router } from 'express';
import { userRouter } from './userRoutes.js';
import { phoneRouter } from './phoneRoutes.js';
import { messageRouter } from './messageRoutes.js';
import { heartbeatRouter } from './heartbeatRoutes.js';
import { threadRouter } from './threadRoutes.js';
import { contactRouter } from './contactRoutes.js';
import { phoneApiKeyRouter } from './phoneApiKeyRoutes.js';
import { webhookRouter } from './webhookRoutes.js';
import { statsRouter } from './statsRoutes.js';

export const apiRouter = Router();

apiRouter.use(userRouter);
apiRouter.use(phoneRouter);
apiRouter.use(messageRouter);
apiRouter.use(heartbeatRouter);
apiRouter.use(threadRouter);
apiRouter.use(contactRouter);
apiRouter.use(phoneApiKeyRouter);
apiRouter.use(webhookRouter);
apiRouter.use(statsRouter);


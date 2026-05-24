// import { Injectable, OnModuleInit } from '@nestjs/common';
// import { PrismaClient } from '@prisma/client';
// import { ShutdownService } from '../shutdown/shutdown.service';

// @Injectable()
// export class PrismaService extends PrismaClient implements OnModuleInit {
//   constructor(private shutdown: ShutdownService) {
//     super();

//     this.shutdown.register(async () => {
//       await this.$disconnect();
//       console.log('Prisma disconnected');
//     });
//   }

//   async onModuleInit() {
//     await this.$connect();
//   }
// }
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { IdService } from "./services/id.service";
import { ValidatorService } from "./services/validator.service";
import { BotsService } from "./services/bots.service";
import { HighscoresController } from "./controllers/highscore/highscores.controller";
import { BoardsController } from "./controllers/boards/boards.controller";
import { BotsController } from "./controllers/bots/bots.controller";
import { CustomLogger } from "./logger";
import { BoardsService } from "./services/board.service";
import { HighScoresService } from "./services/high-scores.service";

import { HighScoreEntity } from "./db/models/highScores.entity";
import { BotRegistrationsEntity } from "./db/models/botRegistrations.entity";
import { MetricsService } from "./services/metrics.service";

@Module({
  controllers: [BotsController, BoardsController, HighscoresController],
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env["TYPEORM_HOST"],
      port: parseInt(process.env["TYPEORM_PORT"]),
      username: process.env["TYPEORM_USERNAME"],
      password: process.env["TYPEORM_PASSWORD"],
      database: process.env["TYPEORM_DATABASE"],
      synchronize: true,
      entities: ["**/*.entity{.ts,.js}"],
      migrationsTableName: "migration",
      migrations: ["src/migration/*.ts"],
      ssl: false,
    }),

    TypeOrmModule.forFeature([HighScoreEntity, BotRegistrationsEntity]),
  ],
  providers: [
    CustomLogger,
    BoardsService,
    BotsService,
    IdService,
    ValidatorService,
    HighScoresService,
    MetricsService,
  ],
})
export class AppModule {}

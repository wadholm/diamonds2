import { Injectable } from "@nestjs/common";
import { HighscoreDto } from "../models/highscore.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { HighScoreEntity } from "../db/models/highScores.entity";
import { MetricsService } from "./metrics.service";
import { SeasonsService } from "./seasons.service";

@Injectable()
export class HighScoresService {
  //no db
  private highScores: HighscoreDto[] = [];
  private entityHighScores: string = "highScores";

  constructor(
    @InjectRepository(HighScoreEntity)
    private readonly repo: Repository<HighScoreEntity>,
    private metricsService: MetricsService,
    private seasonService: SeasonsService,
  ) {}

  public async addOrUpdate(input: HighscoreDto): Promise<boolean> {
    if (await this.isNewHighScore(input)) {
      await this.create(input);
      if (this.metricsService) {
        this.metricsService.incHighscoresImproved();
      }
    }

    return Promise.resolve(true);
  }

  public async getBotScore(newScore: HighscoreDto) {
    return this.repo
      .find({
        where: [{ botName: newScore.botName }],
      })
      .then(highScores => highScores.map(e => HighscoreDto.fromEntity(e)));
  }

  private async isNewHighScore(newScore: HighscoreDto) {
    let isNew: boolean = true;
    const season = await this.seasonService.getCurrentSeason();

    const resultSetHighScore = await this.repo
      .createQueryBuilder(this.entityHighScores)
      .where(
        "highScores.botName = :botName AND highScores.seasonId = :seasonId",
        {
          botName: newScore.botName,
          seasonId: season.id,
        },
      )
      .getOne();

    if (resultSetHighScore) {
      if (resultSetHighScore.score < newScore.score) {
        //update
        //console.log("Update HighScore ");

        await this.repo
          .createQueryBuilder()
          .update("high_scores")
          .set({ score: newScore.score })
          .where("botName = :botName AND seasonId = :seasonId", {
            botName: newScore.botName,
            seasonId: season.id,
          })
          .execute();
        isNew = false;
        if (this.metricsService) {
          this.metricsService.incHighscoresImproved();
        }
      } else {
        //console.log("New HighScore is lower or equal ");
        isNew = false;
      }
    } else {
      //console.log("Is new HighScore  ");
    }

    return isNew;
  }

  private updateHighScore(index: number, newScore: HighscoreDto) {
    this.highScores[index] = newScore;
  }

  public async all() {
    return await this.repo
      .find({
        order: {
          score: "DESC",
        },
      })
      .then(highScores => highScores.map(e => HighscoreDto.fromEntity(e)));
  }

  public async allBySeasonId(seasonId: string) {
    const currentSeason = await this.seasonService.getCurrentSeason();
    const limit = seasonId === currentSeason.id ? 50 : 20;
    return await this.repo
      .find({
        where: {
          seasonId,
        },
        order: {
          score: "DESC",
        },
        take: limit,
      })
      .then(highScores => highScores.map(e => HighscoreDto.fromEntity(e)));
  }

  public async create(dto: HighscoreDto): Promise<HighscoreDto> {
    return this.repo.save(dto);
  }

  public async delete(dto: HighscoreDto) {
    return await this.repo
      .createQueryBuilder()
      .delete()
      .from("high_scores")
      .where("botName = :botName", { botName: dto.botName })
      .execute();
  }
}

declare global {
  import { Client } from "oicq";
  import { Logger } from 'log4js';
  import { IProfile, IInfo } from "./bot";

  var yumemi: {
    api: IProfile;
    cmd: IProfile;
    logger: Logger;
    info: IInfo;
  };

  var path: {
    config: string;
    groups: string;
    plugins: string;
    services: string;
    setu: string;
    rank: string;
    emoji: string;
    dynamic: string;
    db: string;
  }

  var bots: Map<string, Client>;
  var __yumeminame: string;
}

export { }
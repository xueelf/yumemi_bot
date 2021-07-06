import { Logger } from 'log4js';
import { Client, ConfBot } from "oicq";

export declare global {
  var yumemi: {
    bots: Map<string, Client>;
    api: IApi;
    cmd: ICmd;
    info: IInfo;
    logger: Logger;
  };

  var __yumeminame: string;
}

interface IBot {
  readonly qq: { masters: number[], uin: number };
  readonly plugins: string[];
  readonly config: ConfBot;
}

interface IApi {
  readonly acgmx: { url: string, key: string };
  readonly hitokoto: { url: string, params: string };
  readonly lolicon: { url: string, key: string };
  readonly pcrdfans: { url: string, key: string };
  readonly saucenao: { url: string, key: string };
  readonly webhook: { path: string, secret: string };
}

interface ICmd {
  readonly [plugin: string]: {
    [string: string]: string
  }
}

interface IInfo {
  readonly admin: number[];
  readonly released: string;
  readonly version: string;
  readonly docs: string;
  readonly changelogs: string;
}

interface IGroups {
  [group_id: number]: {
    name: string;
    plugins: string[];
    settings: {
      [plugin: string]: {
        lock: boolean;
        [param: string]: any;
      }
    }
  }
}

// Client 实例上增加 masters groups 属性
declare module 'oicq' {
  interface Client {
    masters: number[];
    groups: IGroups;
  }
}

type Profile = IApi | IBot | ICmd | IInfo | any
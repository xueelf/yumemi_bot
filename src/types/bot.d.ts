import { Client, ConfBot } from 'oicq';

declare module 'oicq' {
  interface Client {
    master: number[];
    groups: IGroups;
    plugins: Map<string, IPlugins>;
  }
}

interface IPlugins {
  readonly activate: (bot: Client) => void;
  readonly deactivate: (bot: Client) => void;
  readonly [string: string]: Function;
}

interface IBot {
  readonly qq: { master: number[], uin: number, password: string };
  readonly plugins: string[];
  readonly config: ConfBot;
}

interface IAccount {
  readonly uin: number;
  readonly password: string;
  readonly config: ConfBot;
}

interface IManager {
  readonly master: number[];
}

interface IInfo {
  readonly admin: number[];
  readonly released: string;
  readonly version: string;
  readonly docs: string;
  readonly changelogs: string;
}

interface IProfile {
  [string: string]: string | any
}

interface IGroup {
  name: string;
  plugins: string[];
  settings: { [plugin: string]: any }
}

interface IGroups {
  [group_id: string]: IGroup
}

interface IDate {
  time: string,
  today: string,
  tomorrow: string,
  the_month: string,
  next_month: string
}

interface IBoss {
  bl: number[][],
  tw: number[][],
  jp: number[][],
}
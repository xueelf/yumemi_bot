declare module 'bili-api' {
  export default function (object: { [string: string]: number }, targets: string[]): Promise<any>
}
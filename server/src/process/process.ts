"use strict";

import * as cp from "child_process";
import {
    CommandEndFailedException, CommandFailedException,
    DafnyServerExeption, RequestFailedException
} from "../errorHandling/errors";

export class ProcessWrapper {
    public pid: number;
    public outBuf: string = "";
    private serverProc: cp.ChildProcess = null;
    private commandEndRegex: RegExp = /\[\[DAFNY-SERVER: EOM\]\]/;
    constructor(
        process: cp.ChildProcess,
        errorCallback: (error: Error) => void,
        dataCallback: () => void,
        exitCallback: (code: number) => void) {
        if (!process.pid) {
            throw new DafnyServerExeption();
        }
        this.pid = process.pid;
        this.serverProc = process;
        this.serverProc.stdout.on("error", errorCallback);
        this.serverProc.stdout.on("data", (data: Buffer) => {
            this.outBuf += data.toString();
            dataCallback();
        });
        this.serverProc.on("exit", exitCallback);
    }

    public killServerProc(): void {
        this.serverProc.stdout.removeAllListeners();
        this.serverProc.removeAllListeners();
        this.serverProc.kill();
    }

    public isAlive(): boolean {
        return this.serverProc !== null;
    }

    public clearBuffer(): void {
        this.outBuf = "";
    }
    public sendRequestToDafnyServer(request: string, verb: string): void {
        this.writeRequestToServer(request, verb, "[[DAFNY-CLIENT: EOM]]",
            "Verification command failed of request: ${request}", "Verification request failed of task: ${request}");
    }

    public sendQuit(): void {
        this.serverProc.stdout.removeAllListeners();

        const good: boolean = this.serverProc.stdin.write("quit\n", () => {
            if (!good) {
                throw new CommandFailedException("Sending of quit failed");
            }
        });
    }

    public commandFinished(): boolean {
        return this.outBuf.search(this.commandEndRegex) > -1;
    }

    public positionCommandEnd(): number {
        return this.outBuf.search(this.commandEndRegex);
    }
    private writeRequestToServer(request: string, verb: string, serverEndTag: string,
                                 commandFailedMessage: string, requestFailedMessage: string): void {
        this.serverProc.stdin.write(verb + "\n", () => {
            this.serverProc.stdin.write(request + "\n", () => {
                this.serverProc.stdin.write(serverEndTag + "\n", () => {});
            });
        });
    }
}

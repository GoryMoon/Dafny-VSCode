"use strict";

import * as cp from "child_process";
import * as os from "os";
import * as vscode from "vscode";
import {Config, EnvironmentConfig, ErrorMsg, WarningMsg } from "../Strings/stringRessources";

export class Command {
    public notFound: boolean = false;
    // tslint:disable-next-line:no-empty
    public constructor(public command: string = null, public args: string[]= null) {};
}

export class Environment {

    public usesMono: boolean;
    public hasCustomMonoPath: boolean;
    private config: vscode.WorkspaceConfiguration;
    private dafnyServerPath: string;

    constructor() {
        this.config = vscode.workspace.getConfiguration(EnvironmentConfig.Dafny);
        this.usesMono = this.config.get<boolean>(Config.UseMono) || os.platform() !== EnvironmentConfig.Win32;
        this.dafnyServerPath = this.config.get<string>(Config.DafnyServerPath);
        const monoPath: string = this.config.get<string>(Config.MonoPath);
        this.hasCustomMonoPath = monoPath !== "";
    }

    public TestCommand(path: string): boolean {
        const process: cp.ChildProcess = cp.exec(path);
        const commandSuccessful: boolean = process.pid !== 0;
        if (commandSuccessful) {
            process.kill();
        }
        return commandSuccessful;
    }

    public GetStartDafnyCommand(): Command {
        let serverPath: string;
        let args: string[];
        let monoPath: string = this.config.get<string>(Config.MonoPath);
        if (!this.usesMono) {
            serverPath = this.dafnyServerPath;
            args = [];
            return new Command(serverPath, args);
        } else {
            const monoInSystemPath: boolean = this.TestCommand(EnvironmentConfig.Mono);
            const monoAtConfigPath: boolean = this.hasCustomMonoPath && this.TestCommand(monoPath);
            if (monoInSystemPath && !monoAtConfigPath) {
                if (this.hasCustomMonoPath) {
                    vscode.window.showWarningMessage(WarningMsg.MonoPathWrong);
                }
                monoPath = EnvironmentConfig.Mono;
            } else if (!monoInSystemPath && !monoAtConfigPath) {
                vscode.window.showErrorMessage(ErrorMsg.NoMono);
                const command: Command = new Command();
                command.notFound = true;
                return command;
            }
            serverPath = monoPath;
            args = [this.dafnyServerPath];
            return new Command(serverPath, args);
        }
    }

    public GetStandardSpawnOptions(): cp.SpawnOptions {
        const options: cp.SpawnOptions = {};
        if (vscode.workspace.rootPath) {
            options.cwd = vscode.workspace.rootPath;
        }
        options.stdio = [
            "pipe", // stdin
            "pipe", // stdout
            0, // ignore stderr
        ];
        return options;
    }

    public UsesNonStandardMonoPath(): boolean {
        return this.usesMono && this.hasCustomMonoPath;
    }
}

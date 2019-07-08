import * as dropbox from 'dropbox';
import { Injectable } from '@angular/core';
import { IArchive } from './database';
import { readFile } from './util';
import { Data } from './data';
import { Messenger } from './messenger';
export interface IDropboxInfo {
    id?: string;
    token: null,
    userId: null,
    accountId: null,
}
const PATH_ROOT = '/FreeMasensHealthTracker';
const HISTORY_FILE = 'healthTrackerHistory.json';
const FULL_PATH = PATH_ROOT + '/' + HISTORY_FILE;
export interface IDropboxUploadResult {
    fileHash: string;
    fileModified: string;
}

export interface IDropboxChanges {
    id?: string;
    archive?: IArchive;
    fileHash: string,
    fileModified: string;
}

@Injectable({
    providedIn: 'root',
})
export class RawDropboxSync {
    constructor() {}

    public async init(accessToken: string): Promise<void> {
        await this.ensureFileStructure(accessToken);
    }

    public extractHash(): IDropboxInfo {
        let parts = location.hash.split('&');
        return parts.reduce((acc, p) => {
            if (p[0] === '#') {
                p = p.substr(1);
            }
            let pair = p.split('=');
            switch (pair[0]) {
                case 'access_token':
                    acc.token = pair[1];
                break;
                case 'uid':
                    acc.userId = pair[1];
                break;
                case 'account_id':
                    acc.accountId = pair[1]
                break;
            }
            return acc;
        }, {token: null,
            userId: null,
            accountId: null,
        });
        
    }

    async requestDropboxAuthentication(clientId) {
        console.log('requestDropboxAuthentication');
        let dbx = new dropbox.Dropbox({clientId, fetch});
        let url = dbx.getAuthenticationUrl('http://localhost:4200/setup-sync/');
        window.open(url, '_blank');
        return url;
    }

    async ensureFileStructure(accessToken: string) {
        let dbx = new dropbox.Dropbox({accessToken, fetch});
        let files: dropbox.files.ListFolderResult;
        try {
            files = await dbx.filesListFolder({path: PATH_ROOT});
        } catch {
            await dbx.filesCreateFolder({path: PATH_ROOT});
            files = await dbx.filesListFolder({path: PATH_ROOT});
            files.entries
        }
        if (files.entries.length === 0) {
            await this.sendChangesToDropbox(dbx);
        } else {
            let file = files.entries.find(f => f.name === HISTORY_FILE);
            if (!file) {
                await this.sendChangesToDropbox(dbx);
            }
        }
    }

    async sendChangesToDropbox(dbx: dropbox.Dropbox, archive?: IArchive) {
        if (!archive) {
            archive = {
                mealHistory: [],
                bodyHistory: [],
            }
        }
        let result = await dbx.filesUpload({path: FULL_PATH, contents: JSON.stringify(archive), mode: {'.tag': 'overwrite'}});
        return {
            fileModified: result.client_modified,
            fileHash: result.content_hash
        }
    }

    async getChangesFromDropbox(accessToken: string, currentHash: string): Promise<IDropboxChanges | void> {
        let dbx = new dropbox.Dropbox({accessToken, fetch});
        let metaInfo: dropbox.files.FileMetadataReference;
        try {
            metaInfo = await dbx.filesGetMetadata({ path: FULL_PATH, include_deleted: false }) as dropbox.files.FileMetadataReference;
        } catch (e) {
            return console.error('error getting meta info', e);
        }
        if (metaInfo.content_hash !== currentHash) {
            let dl: dropbox.files.FileMetadata & { fileBlob?: File};
            try {
                dl = await dbx.filesDownload({path: FULL_PATH});
            } catch (e) {
                return console.error('error downloading file', e);
            }
            if (dl.fileBlob) {
                let contents = await readFile(dl.fileBlob);
                let data = JSON.parse(contents);
                return {
                    archive: data,
                    fileHash: dl.content_hash,
                    fileModified: dl.client_modified,
                };
            }
        }
    }
}

@Injectable({
    providedIn: 'root',
})
export class Sync {
    private dropboxInfo: IDropboxInfo;
    private dropboxTimer;
    constructor(
        private dropbox: RawDropboxSync,
        private data: Data,
        private msg: Messenger,
    ) {
        data.getDropBoxInfo().then(info => {
            if (!info) {
                return;
            }
            this.dropboxInfo = info;
            this.dropboxSync().then(() => {});
        });
    }

    public async requestNewDropbox() {
        this.dropbox.requestDropboxAuthentication('6qddpekngz9fnji');
    }
    public async completeDropboxSetup() {
        this.dropboxInfo = this.dropbox.extractHash();
        await this.data.addDropBoxInfo(this.dropboxInfo);
        await this.dropbox.init(this.dropboxInfo.token);
        this.msg.send("Dropbox setup complete", false);
        await this.dropboxSync();
    }

    private startTimer(service: ServiceKind) {
        switch (service) {
            case ServiceKind.Dropbox:
                this.dropboxTimer = setTimeout(
                    async () => 
                        await this._dropboxSync()
                    , 5 * 60 * 1000
                )
            break;
        }
    }
    private async _dropboxSync() {
        await this.dropboxSync()
        this.startTimer(ServiceKind.Dropbox);
    }
    private async dropboxSync() {
        this.msg.send('syncing dropbox', false);
        if (!this.dropboxInfo) {
            return console.error('attempt to sync dropbox with no credentials');
        }
        let lastHash = await this.data.getLastDropboxHash();
        let changes = await this.dropbox.getChangesFromDropbox(this.dropboxInfo.token, lastHash);
        if (changes && changes.fileHash != lastHash) {
            await this.data.importArchive(changes.archive, false);
            console.log('imported changes');
            await this.data.saveDropboxChanges(changes);
            console.log('saved change info');
        }
        let update = await this.data.getAllUserData();
        let dbx = new dropbox.Dropbox({accessToken: this.dropboxInfo.token, fetch});
        let newChanges = await this.dropbox.sendChangesToDropbox(dbx, update);
        await this.data.saveDropboxChanges(newChanges);
        this.msg.send('dropbox sync complete', false);
    }
    public async triggerSync() {
        if (this.dropboxInfo) {
            this.dropboxSync();
        }
    }
    async hasDropboxSetup() {
        if (!this.dropboxInfo) {
            return this.data.getDropBoxInfo().then(info => {
                if (!info) {
                    return false;
                }
                this.dropboxInfo = info;
                return true;
            });
        }
        return true;
    }
    async stopDropbox() {
        if (this.dropboxTimer) {
            clearTimeout(this.dropboxTimer);
        }
        if (this.dropboxInfo) {
            await this.data.dropboxInfo.clear();
            this.dropboxInfo = null;
        }
    }
}

export enum ServiceKind {
    Dropbox,
}
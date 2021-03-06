import { R20Bootstrapper } from "../../utils/R20Bootstrapper";
import { Config } from "../../utils/Config";
import { getBrowser } from "../../utils/MiscUtils";
import {isChromium} from "../../utils/BrowserDetection";

class LocalStorageBootstrapper extends R20Bootstrapper.Base {
    constructor() {
        super(__dirname);
        this.recvAppMessage = this.recvAppMessage.bind(this);
    }

    generatePatch(ids, externalCallback) {

        function callback(p) {
            let patch = {};
            console.log("generating patch, got values:");
            console.log(p);

            for (const key of ids) {
                patch[key] = key in p ? p[key] : {};
            }

            console.log("done!");
            console.log(patch);

            externalCallback(patch);
        }

        if (isChromium()) {
            chrome.storage.local.get(callback);
        } else {
            browser.storage.local.get().then(callback)
        }
    }

    recvAppMessage(e) {

        if (e.origin !== Config.appUrl) return;

        console.log("Content-script received message from site with proper origin.");
        console.log(e);

        if (e.data.r20sAppWantsInitialConfigs) {
            this.generatePatch(e.data.r20sAppWantsInitialConfigs, p => {
                console.log("Content-script is dispatching a config patch:");
                console.log(p);
                window.postMessage({ r20esInitialConfigs: p }, Config.appUrl);
            });
        } else if (e.data.r20esAppWantsSync) {
            const patch = e.data.r20esAppWantsSync;
            getBrowser().storage.local.set(patch);
        }
    }

    setup() {
        window.addEventListener("message", this.recvAppMessage);
    }

    disposePrevious() {
        window.removeEventListener("message", this.recvAppMessage);
    }
}

export { LocalStorageBootstrapper };

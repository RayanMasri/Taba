const main = chrome.extension.getURL('index.html');
const container = document.getElementById("main-container");

class Element {
    create(object) {
        let element = document.createElement(object.tag);
        if(object.class) {
            element.setAttribute("class", object.class);
        }

        element.innerHTML = object.text || "";

        if(object.first) {
            object.parent.insertBefore(element, object.parent.firstChild);
        } else {
            object.parent.appendChild(element);
        }
        
        return element;
    }

    // Returns the index of a child node
    indexof(element, parent) {
        let index = Array.from(parent.children).indexOf(element);
        return index;
    }

    delete(element) {
        element.parentNode.removeChild(element);
    }

    onleft(element, callback) {
        element.addEventListener("mouseup", event => {
            if(event.which == 1) {
                callback(event);
            }
        })
    } 
}

class Tab extends Element {
    constructor(object) {
        super();
        this.load(object);
    }

    load(object) {
        this.tab = object.tab;
        this.url = this.tab.url || this.tab.pendingUrl;
        this.domain = new URL(this.url).hostname;
        
        this.session = [object.session, object.index];
        this.onchange = object.onchange;
        this.deleted = false;
    }

    remove(callback) {
        chrome.storage.local.get(["sessions"], result => {
            let sessions = result["sessions"] || [];

            // Remove current tab
            let [session, index] = this.session;
            sessions[index].group.splice(this.indexof(this.element, this.parent), 1);

            // Save new sessions
            chrome.storage.local.set({"sessions": sessions}, () => {
                callback();
            })
        });
    }

    render(parent) {  
        // Create link & link container
        this.parent = parent;
        this.element = this.create({ tag: "div", parent: parent });  
                
        let text = this.create({ tag: "p", text: this.domain, parent: this.element });

        // Handle left click event
        this.onleft(text, event => {
            // Get main tab
            chrome.tabs.query({ currentWindow: true, active: true }, tabs => {                
                for(let tab of tabs) {
                    // Show this.tab
                    chrome.tabs.create({ url: this.url, index: 1 });

                    // Focus on main tab
                    chrome.tabs.update(tab.id, { active: true });                                    
                }
            });

            // Remove from storage
            this.remove(() => {
                // Delete link html element
                this.delete(this.element);

                // Log as deleted
                let [session, index] = this.session;
                this.deleted = true;
                this.onchange.bind(session)();
            });
        })
    }
}

class Session extends Element {
    constructor(object) {
        super();
        this.load(object);
    }

    onchange(tab) {        
        // Check if session is still active by finding if there is an active tab
        let alive = this.group.find(tab => !tab.deleted);
        if(!alive) {
            // Delete the session element
            this.delete(this.session);

            // Remove from storage
            this.remove();
        }
    }   

    load(object) {        
        this.time = object.time;
        this.title = object.title;
        this.index = object.index;
        this.group = object.group.map(tab => {
            return new Tab({ tab: tab, index: object.index, onchange: this.onchange, session: this })
        });
    }
    
    remove() {
        chrome.storage.local.get(["sessions"], result => {
            let sessions = result["sessions"] || [];

            // Remove current tab
            sessions.splice(this.index, 1);

            // Save new sessions
            chrome.storage.local.set({"sessions": sessions})
        });
    }

    render(parent) {
        // TODO: implement JSX

        // Create session container
        let session = this.create({ tag: "div", class: "session", parent: parent, first: true });
        this.session = session;

        // Create info (date & title)
        let info = this.create({ tag: "div", class: "session-header", parent: session });
        this.create({ tag: "p", class: "session-title", text: this.title, parent: info});
        this.create({ tag: "p", class: "session-date", text: this.time, parent: info });

        // Create tabs container
        let tabs = this.create({ tag: "div", class: "session-tabs", parent: session });

        // Create tabs
        this.group.map(tab => tab.render(tabs));
    }
}

// Load local sessions
chrome.storage.local.get(["sessions"], result => {
    let sessions = result["sessions"] || [];

    // Iterate through sessions
    sessions.map((session, index) => {    
        // Unpack session
        session = new Session({
            group: session.group,
            time: session.time,
            title: session.title,
            index: index
        });

        // Render session
        session.render(container);
    })
})
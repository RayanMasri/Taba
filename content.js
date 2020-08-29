const main = chrome.extension.getURL('index.html');
const container = document.getElementById("sessions");

class Element {
    // Creates an HTML Element 
    create(object, attributes={}) {
        // Create element
        let element = document.createElement(object.tag);

        // Add attributes
        Object.entries(attributes).map(([key, value]) => {
            if(key == "style") {
                Object.entries(value).map(([key, value]) => {
                    element.setAttribute("style", `${key}: ${value};`);
                })
            } else {
                element.setAttribute(key, value);
            }
        })

        element.innerHTML = object.text || "";

        if(object.first) {
            object.parent.insertBefore(element, object.parent.firstChild);
        } else {
            object.parent.appendChild(element);
        }
        
        return element;
    }

    // Deletes an HTML Element
    destroy(element) {
        element.parentNode.removeChild(element);
    }

    // Returns the index of a child node
    indexof(element, parent) {
        console.log(element.parentNode);
        let index = Array.from(element.parentNode.children).indexOf(element);
        return index;
    }

    // Handles left click
    onleft(element, callback) {
        element.addEventListener("click", event => {
            if(event.which == 1) {
                event.preventDefault();
                callback(event);
            }
        })
    } 
    
    // Handles middle click
    onmiddle(element, callback) {
        element.addEventListener("click", event => {
            if(event.which == 2) {
                event.preventDefault();
                callback(event);
            }
        })
    } 

    // Handles hover in
    onover(element, callback) {
        element.addEventListener("mouseover", event => {
            callback(event);
        })
    }

    // Handles hover out
    onout(element, callback) {
        element.addEventListener("mouseout", event => {
            callback(event);
        })
    }
}

class Tab extends Element {
    constructor(object) {
        super();
        this.session = [object.session, object.index];
        this.onchange = object.onchange;
        this.tab = object.tab;

        // Get URL and domain name
        this.url = this.tab.url || this.tab.pendingUrl;
        this.domain = new URL(this.url).hostname;

        // Get favicon
        this.icon = "https://www.google.com/s2/favicons?domain=" + this.domain;      

        this.deleted = false;
    }

    // Restores this Tab
    restore() {
        chrome.tabs.query({ currentWindow: true, active: true }, tabs => {                
            // Get Taba tab
            for(let tab of tabs) {
                // Create a new tab with this Tab instance's url
                chrome.tabs.create({ url: this.url, index: 1 });

                // Focus back on Taba tab
                chrome.tabs.update(tab.id, { active: true });                                    
            }
            // callback();
        });
    }
    
    // Removes this Tab from the current session storage
    remove() {
        // Load sessions
        chrome.storage.local.get(["sessions"], result => {
            let sessions = result["sessions"] || [];

            // Remove tab from storage array
            let [session, index] = this.session;
            sessions[index].group.splice(this.indexof(this.container), 1);

            // Save new storage array
            chrome.storage.local.set({"sessions": sessions}, () => {
                // Destroy link html element
                this.destroy(this.container);
                this.deleted = true;

                // Call this session's onchange
                let [session, _] = this.session;
                this.onchange.bind(session)();

                // callback();
            });
        });
    }

    // Renders the Tab instance into an HTML Element
    render(parent) {  
        // Create this Tab instance's container
        this.container = this.create({ tag: "div", parent: parent });  
    
        // Create close image
        let close = this.create({ tag: "img", parent: this.container }, {
            src: "./assets/close.png",
            class: "tab-delete"
        })

        // Create icon
        this.create({ tag: "img", parent: this.container }, {
            src: this.icon,
        })
        
        // Create a text element containing this instance's domain name
        let text = this.create({ tag: "p", text: this.domain, parent: this.container });
        
        // Handle events on close button
        this.onover(this.container, () => close.style.visibility = "visible");
        this.onout(this.container, () => close.style.visibility = "hidden");
        this.onleft(close, () => this.remove())

        // Handle events on link element
        // Left Button Click
        this.onleft(text, () => {
            this.restore();
            this.remove();
        })

        // Middle Button Click
        this.onmiddle(text, () => this.restore());
    }
}

class Session extends Element {
    constructor(object) {
        super();
        this.group = object.group.map(tab => {
            return new Tab({ tab: tab, index: object.index, onchange: this.onchange, session: this })
        });
        this.time = object.time;
        this.index = object.index;
        this.favorite = object.favorite;
        this.getcount();
    }    

    getstar() {
        return this.favorite ? "./assets/star-fill.png" : "./assets/star-empty.png";
    }

    setfavorite(condition) {
        this.favorite = condition;

        chrome.storage.local.get(["sessions"], result => {
            let sessions = result["sessions"] || [];

            // Remove current tab
            console.log(this.index);
            sessions[this.index].favorite = this.favorite;

            // Save new sessions
            chrome.storage.local.set({"sessions": sessions})
        });
    }

    // Called when a tab is removed/restored from a session
    onchange(tab) {        
        // Update count
        this.getcount();
        this.title.innerHTML = this.count; 

        // Check if session is still active by finding if there is an active tab
        let alive = this.group.find(tab => !tab.deleted);
        if(!alive) {
            // Delete the session element
            this.destroy(this.session);

            // Remove from storage
            this.remove();
        }
    }   

    // Updates session tab count
    getcount() {
        let value = this.tabs ? this.tabs.children.length : this.group.length;
        this.count = `${value} tab${value > 1 ? "s" : ""}`;
    }

    // Removes session from sessions storage
    remove() {
        chrome.storage.local.get(["sessions"], result => {
            let sessions = result["sessions"] || [];

            // Remove current tab
            sessions.splice(this.index, 1);

            // Save new sessions
            chrome.storage.local.set({"sessions": sessions})
        });
    }

    // Renders the Session instance into an HTML Element
    render(parent) {
        // Create session container
        let session = this.create({ tag: "div", parent: parent, first: true }, { class: "session" });
        this.session = session;

        // Create info (date & title)
        let header = this.create({ tag: "div", parent: session }, { class: "session-header" });
        this.title = this.create({ tag: "p", text: this.count, parent: header}, { class: "session-title" });
        this.create({ tag: "p", text: this.time, parent: header }, { class: "session-date" });
        this.star = this.create({ tag: "img", parent: header }, {
            src: this.getstar(),
            style: {
                visibility: this.favorite ? "visible" : "hidden"
            }
        });

        this.onleft(this.star, () => {
            this.setfavorite(!this.favorite);
            this.star.src = this.getstar();
        });

        this.onover(header, () => this.star.style.visibility = "visible");
        this.onout(header, () => this.star.style.visibility = this.favorite ? "visible" : "hidden");

        // Create tabs container
        this.tabs = this.create({ tag: "div", parent: session }, { class: "session-tabs" });

        // Create tabs
        this.group.map(tab => tab.render(this.tabs));
    }
}

// Load local sessions
chrome.storage.local.get(["sessions"], result => {
    let sessions = result["sessions"] || [];

    // Unpack sessions
    sessions = sessions.map((session, index) => {
        return {
            group: session.group,
            time: session.time,
            favorite: session.favorite,
            index: index
        };
    });
    

    // Sort sessions by favorite
    sessions = sessions.sort((x, y) => {
        return (x.favorite === y.favorite) ? 0 : x.favorite ? 1 : -1;
    })

    // Render sessions
    sessions.map((session) => {
        session = new Session({
            group: session.group,
            time: session.time,
            favorite: session.favorite,
            index: session.index
        })

        session.render(container);

        console.log(session);
    });
    
    
})
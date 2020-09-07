// session object format
// {
//     group: "an array of chrome tabs defaults to []",
//     date: "a javascript date object defaults to undefined",
//     favorite: "a boolean defaults to false",
//     shown: "a boolean defaults to true"
// }

// $.post('https://file.io/', {text: "hello"}, function(data, status) {
//     console.log(data);  
// })


const main = chrome.extension.getURL('index.html');
const container = document.getElementById("sessions");

// Handles left click event on an HTML Element
HTMLElement.prototype.onleft = function(callback) {
    this.addEventListener("click", event => {
        if(event.which == 1) {
            event.preventDefault();
            callback(event);
        }
    })
}

// Handles middle click event on an HTML element
HTMLElement.prototype.onmiddle = function(callback) {
    this.addEventListener("mouseup", event => {
        if(event.which == 2) {
            event.preventDefault();
            callback(event);
        }
    })
}

// Handles mouse over event on an HTML Element
HTMLElement.prototype.onover = function(callback) {
    this.addEventListener("mouseover", event => {
        event.preventDefault();
        callback(event);       
    })
}

// Handles mouse out event on an HTML Element
HTMLElement.prototype.onout = function(callback) {
    this.addEventListener("mouseout", event => {
        event.preventDefault();
        callback(event);
    })
}

// Gets index of html element according to parent
HTMLElement.prototype.indexof = function() {
    return Array.from(this.parentNode.children).indexOf(this);
}

class Element {
    insert(template, parent) {
        // Create element
        let element = document.createElement('template');
        element.innerHTML = template;

        // Extract references
        let references = {}

        Array.from(element.content.querySelectorAll("*")).map(element => {
            let reference = element.getAttribute("ref");
            if(reference) {                
                references[reference] = element;
                element.removeAttribute("ref");
            }
        })

        // Append template to parent
        parent.appendChild(element.content);

        return {
            element: element,
            references: references
        }
    }

    // Deletes an HTML Element
    destroy(element) {
        element.parentNode.removeChild(element);
    }
}

class Tab extends Element {
    constructor(object) {
        super();
        this.session = object.session;
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
        if(!this.deleted) {
            chrome.tabs.query({ currentWindow: true, active: true }, tabs => {                
                // Get Taba tab
                for(let tab of tabs) {
                    // Create a new tab with this Tab instance's url
                    chrome.tabs.create({ url: this.url, index: tab.index + 1});
    
                    // Focus back on Taba tab
                    chrome.tabs.update(tab.id, { active: true });                                    
                }
            });
        }
    }
    
    // Removes this Tab from the current session storage
    remove() {
        // Load sessions
        chrome.storage.local.get(["sessions"], result => {
            let sessions = result["sessions"] || [];

            let [session, tab] = [
                this.session.references.session.indexof(),
                this.references.tab.indexof()
            ];

            // Remove tab from storage array
            sessions[session].group.splice(tab, 1);

            // Save new storage array
            chrome.storage.local.set({"sessions": sessions}, () => {
                // Destroy link html element
                this.destroy(this.references.tab);
                this.deleted = true;

                // Call this session's onchange
                this.onchange.bind(this.session)(this);
            });
        });
    }

    // Renders the Tab instance into an HTML Element
    render(parent) {  
        // let {_, references} = this.insert(`
        //     <div ref="container">
        //         <img src="./assets/close.png" class="tab-delete" ref="close"></img>
        //         <img src=${this.icon}></img>
        //         <p ref="text">${this.domain}</p>
        //     </div>
        // `, parent);
        let {_, references} = this.insert(`
            <div class="session-tab" ref="tab">
                <div class="session-tab-data">
                    <div class="session-tab-icon">
                        <img src=${this.icon}>
                    </div>
                    <div class="session-tab-name">
                        <div>${this.domain}</div>
                    </div>
                </div>
                <div class="session-tab-date">
                    <div>${this.session.time}</div>
                </div>
                <div class="session-tab-close" ref="close">
                    <img src="./assets/ic_close_48px.png">
                </div>  
            </div>
        `, parent);

        this.references = references;

        this.references.close.onleft((event) => {
            event.stopPropagation();
            this.remove();
        })
        
        this.references.tab.onleft(() => {
            this.restore();
            this.remove();
        })

        this.references.tab.onmiddle(() => {
            this.restore();
        })
        // references.text.onleft(() => {
        //     this.restore();
        //     this.remove();
        // })

        // references.container.onover(() => references.close.style.visibility = "visible");
        // references.container.onout(() => references.close.style.visibility = "hidden");        
        // references.close.onleft(() => this.remove());
    }
}

class Session extends Element {
    constructor(object) {
        super();
        this.group = object.group.map((tab, index) => {            
            return new Tab({ tab: tab, session: this, onchange: this.onchange })
        });
        this.date = object.date;
        this.time = object.time;
        this.index = object.index;
        this.favorite = object.favorite;
    }    

    getstar() {
        return this.favorite ? "./assets/star-fill.png" : "./assets/star-empty.png";
    }

    setfavorite(condition) {
        this.favorite = condition;

        chrome.storage.local.get(["sessions"], result => {
            let sessions = result["sessions"] || [];

            // Favorite the session
            sessions[this.index].favorite = this.favorite;

            // Save new sessions
            chrome.storage.local.set({"sessions": sessions})
        });
    }

    // Called when a tab is removed/restored from a session
    onchange(tab) {   
        // Check if session is still active by finding if there is an active tab
        let alive = this.group.find(tab => !tab.deleted);

        if(!alive) {
            // Remove from storage
            this.remove(() => {
                // Delete the session element
                this.destroy(this.references.session);
            });
        } else {
            // Update tab title to match tab count
            this.references.title.innerHTML = `${this.references.tabs.children.length} tabs`; 
        }
    }   

    // Removes session from sessions storage
    remove(callback) {
        chrome.storage.local.get(["sessions"], result => {
            let sessions = result["sessions"] || [];

            // Remove current tab
            let index = Array.from(container.children).indexOf(this.references.session);
            sessions.splice(index, 1);

            // Save new sessions
            chrome.storage.local.set({"sessions": sessions})

            callback();
        });
    }

    // Renders the Session instance into an HTML Element
    render() {
        let {_, references} = this.insert(`
            <div class="session" ref="session">
                <div class="session-header">
                    <div class="session-title-container">
                        <div class="session-title" ref="title">${this.group.length} tabs</div>
                    </div>
                    <div class="session-actions">
                        <div class="session-action-restore" ref="restore">
                            <img src="./assets/ic_refresh_48px.png">
                        </div>  
                        <div class="session-action-close" ref="remove">
                            <img src="./assets/ic_close_48px.png">
                        </div>  
                        <div class="session-action-hide">
                            <img src="./assets/ic_keyboard_arrow_down_48px.png">
                        </div>      
                        <div class="session-action-favourite">
                            <img src="./assets/favourite-31-2.png">
                        </div>  
                    </div>
                </div>
                <div class="session-tabs" ref="tabs"/>
            </div>
        `, container)


        this.references = references;

        // Render all tabs
        this.group.map(tab => tab.render(references.tabs));

        this.references.remove.onleft(() => {
            // Remove from storage
            this.remove(() => {
                // Delete the session element
                this.destroy(this.references.session);
            }); 
        })

        this.references.restore.onleft(() => {
            this.group.map((tab) => {
                tab.restore();
                tab.remove();
            })
        })
        // references.star.onleft(() => {
        //     this.setfavorite(!this.favorite);
        //     references.star.src = this.getstar();
        // })     
        
        // references.close.onleft(() => {
        //     // Remove from storage
        //     this.remove(() => {
        //         // Delete the session element
        //         this.destroy(this.references.session);
        //     }); 
        // })
    }
}

// Load local sessions
chrome.storage.local.get(["sessions"], result => {
    let sessions = result["sessions"] || [];

    // Unpack sessions
    sessions = sessions.map(session => {
        return {
            group: session.group,
            time: session.time,
            favorite: session.favorite,
            date: session.date
        };
    });
    

    // Sort sessions by date
    sessions = sessions.sort((x, y) => {
        return (x.date - y.date > 0 ? -1 : 1);
    });

    // Sort sessions by favorited
    sessions = sessions.sort((x, y) => {
        return (x.favorite === y.favorite) ? 0 : x.favorite ? -1 : 1;
    });

    chrome.storage.local.set({sessions: sessions}, () => {
        // Render sessions
        sessions.map((session, index) => {
            session = new Session({
                group: session.group,
                time: session.time,
                favorite: session.favorite,
                date: session.date,
                index: index
            })

            session.render();

            // console.log(`${session.group.length} tabs at index ${index}`);
        });
    });
})
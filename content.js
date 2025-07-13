let isDeleting = false;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'delete_general') {
        deleteProcess('general');
    } else if (request.action === 'delete_restricted') {
        deleteProcess('restricted');
    } else if (request.action === 'clear_trash') {
        startClearTrashProcess();
    }
});

async function deleteProcess(type) {
    if (isDeleting) {
        alert("A delete process is already running.");
        return;
    }

    const finderFunction = type === 'general' ? findGeneralDeleteButtons : findRestrictedDeleteButtons;
    if (finderFunction().length === 0) {
        alert(`Couldn't find any '${type}' items on this page.`);
        return;
    }

    if (!confirm(`Are you sure you want to delete all '${type}' items? This will start automatically.`)) return;

    isDeleting = true;
    alert(`Starting deletion for '${type}' items. The page will scroll automatically.`);

    let totalDeletedCount = 0;
    let consecutivePassesWithNoDeletions = 0;
    const maxEmptyPasses = 2;

    while (consecutivePassesWithNoDeletions < maxEmptyPasses) {
        const clickableElements = finderFunction();

        if (clickableElements.length > 0) {
            consecutivePassesWithNoDeletions = 0;
            for (const el of clickableElements) {
                if (document.body.contains(el)) {
                    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
                    totalDeletedCount++;
                    console.log(`Deleted item #${totalDeletedCount}`);
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }
        } else {
            consecutivePassesWithNoDeletions++;
        }

        window.scrollBy(0, window.innerHeight);
        await new Promise(resolve => setTimeout(resolve, 1500));
    }

    alert(`Process complete. ${totalDeletedCount} '${type}' items were processed.`);
    isDeleting = false;
}

function findGeneralDeleteButtons() {
    const trashIconPath = "M10.556 4a1 1 0 0 0-.97.751l-.292 1.14h5.421l-.293-1.14A1 1 0 0 0 13.453 4zm6.224 1.892-.421-1.639A3 3 0 0 0 13.453 2h-2.897A3 3 0 0 0 7.65 4.253l-.421 1.639H4a1 1 0 1 0 0 2h.1l1.215 11.425A3 3 0 0 0 8.3 22H15.7a3 3 0 0 0 2.984-2.683l1.214-11.425H20a1 1 0 1 0 0-2zm1.108 2H6.112l1.192 11.214A1 1 0 0 0 8.3 20H15.7a1 1 0 0 0 .995-.894zM10 10a1 1 0 0 1 1 1v5a1 1 0 1 1-2 0v-5a1 1 0 0 1 1-1m4 0a1 1 0 0 1 1 1v5a1 1 0 1 1-2 0v-5a1 1 0 0 1 1-1";
    const paths = document.querySelectorAll(`button svg > path[d="${trashIconPath}"]`);
    return Array.from(paths).map(path => path.closest('button')).filter(Boolean);
}

function findRestrictedDeleteButtons() {
    const clickableElements = [];
    const allItems = document.querySelectorAll('div[data-index]');
    for (const item of allItems) {
        if (item.querySelector('svg.lucide-alert-circle')) {
            const deleteIcon = item.querySelector('svg.text-token-text-destructive');
            if (deleteIcon) {
                clickableElements.push(deleteIcon.closest('button') || deleteIcon);
            }
        }
    }
    return clickableElements;
}

function startClearTrashProcess() {
    if (confirm('This will navigate to the trash page to clear it. Continue?')) {
        sessionStorage.setItem('task_clear_trash', 'true');
        if (!window.location.pathname.includes('/library/trash')) {
            window.location.href = '/library/trash';
        } else {
            executeAutoTasks();
        }
    }
}

async function executeAutoTasks() {
    if (sessionStorage.getItem('task_clear_trash') === 'true' && window.location.pathname.includes('/library/trash')) {
        sessionStorage.removeItem('task_clear_trash');
        const initialEmptyButton = await waitForElement('button', 'empty trash');
        if (initialEmptyButton) {
            initialEmptyButton.click();
            const dialogSelector = 'div[role="dialog"][data-state="open"] button';
            const finalConfirmButton = await waitForElement(dialogSelector, 'empty trash');
            if (finalConfirmButton) {
                finalConfirmButton.click();
                alert('Trash cleared!');
            } else {
                alert('Could not find the final "Empty Trash" confirmation button.');
            }
        } else {
            alert('Could not find the initial "Empty Trash" button on the page.');
        }
    }
}

function waitForElement(selector, textContent) {
    return new Promise(resolve => {
        const interval = setInterval(() => {
            const elements = document.querySelectorAll(selector);
            const target = Array.from(elements).find(el => el.textContent.trim().toLowerCase() === textContent.toLowerCase());
            if (target) {
                clearInterval(interval);
                resolve(target);
            }
        }, 500);
        setTimeout(() => {
            clearInterval(interval);
            resolve(null);
        }, 10000);
    });
}

executeAutoTasks();
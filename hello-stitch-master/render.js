const render = (columns) => {
    const colors = [
        "#ea51b2",
        "#00f769",
        "#ebff87",
        "#62d6e8",
        "#b45bcf",
        "#a1efe4",
        "#e9e9f4",
    ];
    const root = document.getElementById("container");

    let colourIndex = 0;

    const renderColumn = (column) => {
        const listItems = column.children
            .map((bookmark) => {
                if (bookmark.children && bookmark.children.length) {
                    return `<li>
                        <div class="subfolder">
                            <h3 class="folder-title" style="color: ${colors[colourIndex]}">
                                ${bookmark.title}
                            </h3>
                            <ul>${renderColumn(bookmark)}</ul>
                        </div>
                    </li>`;
                }

                const title = bookmark.path
                    ? bookmark.path.slice(1).concat(bookmark.title).join("/") // join as path
                    : bookmark.title;

                if (bookmark.isSeparator) {
                    return '<li class="separator">&nbsp;</li>';
                }

                return `<li>
                        <a href="${bookmark.url}" ${
                    title.endsWith("…") ? `title="${bookmark.title}"` : ""
                }>
                            ${title}
                        </a>
                    </li>`;
            })
            .join("");

        colourIndex = colourIndex >= colors.length - 1 ? 0 : colourIndex + 1;
        return `<div class="column">
                <h2 class="folder-name" style="color: ${colors[colourIndex]}">
                    ${column.title}
                </h2>
                <ul>${listItems}</ul>
            </div>`;
    };

    root.innerHTML = columns
        .filter((column) => column.children.length)
        .map(renderColumn)
        .join("");

    document.getElementById("welcome").innerHTML = options.TITLE;
};

// Toggle dropdown visibility
function toggleDropdown(element) {
    const dropdown = element.nextElementSibling;
    const arrow = element.querySelector('.arrow');
    if (dropdown.style.display === "none" || dropdown.style.display === "") {
        dropdown.style.display = "block";
        arrow.innerHTML = "&#9650;"; // Up arrow
    } else {
        dropdown.style.display = "none";
        arrow.innerHTML = "&#9660;"; // Down arrow
    }
}

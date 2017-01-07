(function(w, d){

    String.prototype.replaceAll = function(search, replacement) {
        var target = this;
        return target.split(search).join(replacement);
    };


    function proc_toc(item, list) {
        if (item.tagName == "H2"){
            var newI = d.createElement("i");
            var newA = d.createElement("a");
            var newLi = d.createElement("li");
            newI.classList.add("fa", "fa-archive", "fa-lg", "fa-fw");
            newI.setAttribute("aria-hidden", "true");
            newA.innerHTML = item.textContent;
            newA.classList.add("toc-link");
            newA.insertBefore(newI, newA.childNodes[0]);
            newA.setAttribute("href", item.firstChild.getAttribute("href"));
            newLi.classList.add("waves-block", "waves-effect");
            newLi.appendChild(newA);
            list.appendChild(newLi);
        } else {
            var newDiv = d.createElement("div");
            var newA = d.createElement("a");
            var newLi = d.createElement("li");
            var newUl = d.createElement("ul");
            newDiv.classList.add("side-line");
            newA.setAttribute("href", item.firstChild.getAttribute("href"));
            newA.classList.add("toc-link");
            newA.innerHTML = item.textContent;
            newLi.classList.add("waves-block", "waves-effect");
            newLi.appendChild(newDiv);
            newLi.appendChild(newA);
            newUl.classList.add("sub-nav");
            newUl.appendChild(newLi);
            list.appendChild(newUl);
        }
    }


    function idUnique(str) {
        if (d.getElementById(str)) {
            return idWithNumberUnique(str + "-1");
        } else {
            return str;
        }
    }

    function idWithNumberUnique(str) {
        if (d.getElementById(str)) {
            number = parseInt(/-\d*$/.exec(str)[0].slice(1));
            number += 1;
            number = "-" + number.toString();
            return idWithNumberUnique(str.slice(0,-2) + number);
        } else {
            return str;
        }
    }


    var h2s = d.getElementsByTagName("h2");
    var h3s = d.getElementsByTagName("h3");

    for (var i=0; i<h2s.length; i++) {
        var newA = d.createElement("a");
        var anchorlinkA = d.createElement("a");
        var newI = d.createElement("i");
        newI.classList.add("fa", "fa-link");
        anchorlinkA.setAttribute("href", "#" + idUnique(h2s[i].textContent.toLowerCase().replaceAll(" ", "-")));
        anchorlinkA.appendChild(newI);
        anchorlinkA.classList.add("anchor-link");
        newA.setAttribute("id", idUnique(h2s[i].textContent.toLowerCase().replaceAll(" ", "-")));
        newA.classList.add("anchor");
        h2s[i].classList.add("anchor-tag");
        h2s[i].appendChild(newA);
        h2s[i].insertBefore(anchorlinkA, h2s[i].childNodes[0]);
    }

    for (var i=0; i<h3s.length; i++) {
        var newA = d.createElement("a");
        var anchorlinkA = d.createElement("a");
        var newI = d.createElement("i");
        newI.classList.add("fa", "fa-link");
        anchorlinkA.setAttribute("href", "#" + idUnique(h3s[i].textContent.toLowerCase().replaceAll(" ", "-")));
        anchorlinkA.appendChild(newI);
        anchorlinkA.classList.add("anchor-link-disabled");
        newA.setAttribute("id", idUnique(h3s[i].textContent.toLowerCase().replaceAll(" ", "-")));
        newA.classList.add("anchor");
        h3s[i].classList.add("anchor-tag");
        h3s[i].appendChild(newA);
        h3s[i].insertBefore(anchorlinkA, h3s[i].childNodes[0]);
    }

    var toc = d.getElementById("content").querySelectorAll("h2, h3");
    var toc_list = d.getElementById("table-of-content");

    for (var i=0; i<toc.length; i++) {
        proc_toc(toc[i], toc_list);
    }

    var toc_links = d.getElementsByClassName("toc-link");

    for (var i=0; i<toc_links.length;i++) {
        toc_links[i].addEventListener("mouseup", function() {
            menu.classList.remove('show');
            mask.classList.remove('in');
        });
    }
})(window, document);

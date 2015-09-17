/* inspired by
 https://github.com/bpampuch/pdfmake/issues/205
 http://jsfiddle.net/mychn9bo/4/
 */

var html2pdfmake = function (html) {
    var content = [];
    ParseHtml(content, html);

    console.log('#html2pdfmake', content);
    return content;


    function ParseContainer(cnt, e, p, styles) {
        var elements = [];
        var children = e.childNodes;
        if (children.length !== 0) {
            for (var i = 0; i < children.length; i++) {
                p = ParseElement(elements, children[i], p, styles);
            }
        }
        if (elements.length !== 0) {
            for (var i = 0; i < elements.length; i++) {
                cnt.push(elements[i]);
            }
        }
        return p;
    }

    function ComputeStyle(o, styles) {
        for (var i = 0; i < styles.length; i++) {
            var st = styles[i].trim().toLowerCase().split(':');
            if (st.length === 2) {
                switch (st[0]) {
                    case 'font-size':
                        o.fontSize = parseInt(st[1]);
                        break;
                    case 'text-align':
                        switch (st[1]) {
                            case 'right':
                                o.alignment = 'right';
                                break;
                            case 'center':
                                o.alignment = 'center';
                                break;
                        }
                        break;
                    case 'font-weight':
                        switch (st[1]) {
                            case 'bold':
                                o.bold = true;
                                break;
                        }
                        break;
                    case 'text-decoration':
                        switch (st[1]) {
                            case 'underline':
                                o.decoration = 'underline';
                                break;
                        }
                        break;
                    case 'font-style':
                        switch (st[1]) {
                            case 'italic':
                                o.italics = true;
                                break;
                        }
                        break;
                }
            }
        }
    }

    function ParseElement(cnt, e, p, styles) {
        styles = styles || [];
        if (e.getAttribute) {
            var nodeStyle = e.getAttribute('style');
            if (nodeStyle) {
                var ns = nodeStyle.split(';');
                for (var k = 0; k < ns.length; k++) {
                    styles.push(ns[k]);
                }
            }
        }

        var nodeName = e.nodeName.toLowerCase();
        switch (nodeName) {
            case '#text':
                var t = {text: e.textContent.replace(/\n/g, '')};
                if (styles) {
                    ComputeStyle(t, styles);
                }
                p.text.push(t);
                break;
            case 'b':
            case 'strong':
                ParseContainer(cnt, e, p, styles.concat(['font-weight:bold']));
                break;
            case 'u':
                ParseContainer(cnt, e, p, styles.concat(['text-decoration:underline']));
                break;
            case 'i':
                ParseContainer(cnt, e, p, styles.concat(['font-style:italic']));
                break;
            case 'span':
                ParseContainer(cnt, e, p, styles);
                break;
            case 'br':
                p = CreateParagraph();
                cnt.push(p);
                break;
            case 'table':
                var t = {
                    table: {
                        widths: [],
                        body: []
                    }
                };
                var border = e.getAttribute('pdf-border');
                var layouts = ['noBorders', 'headerLineOnly', 'lightHorizontalLines'];
                if (layouts.indexOf(border) > -1) {
                    t.layout = border;
                }
                ParseContainer(t.table.body, e, p, styles);

                var widths = e.getAttribute('pdf-widths');
                if (!widths) {
                    if (t.table.body.length !== 0) {
                        if (t.table.body[0].length !== 0) {
                            for (var k = 0; k < t.table.body[0].length; k++) {
                                t.table.widths.push('*');
                            }
                        }
                    }
                } else {
                    var w = widths.split(/[\s,]+/);
                    for (var k = 0; k < w.length; k++) {
                        t.table.widths.push(w[k]);
                    }
                }
                cnt.push(t);
                break;
            case 'tbody':
                ParseContainer(cnt, e, p, styles);
                break;
            case 'tr':
                var row = [];
                ParseContainer(row, e, p, styles);
                cnt.push(row);
                break;
            case 'td':
                p = CreateParagraph();
                var st = {stack: []};
                st.stack.push(p);

                var rspan = e.getAttribute('rowspan');
                if (rspan) {
                    st.rowSpan = parseInt(rspan);
                }
                var cspan = e.getAttribute('colspan');
                if (cspan) {
                    st.colSpan = parseInt(cspan);
                }

                ParseContainer(st.stack, e, p, styles);
                cnt.push(st);
                break;
            case 'ol':
            case 'ul':
                var st = {};
                st[nodeName] = [];

                console.log('#ol,#ul,#ParseContainer', st[nodeName]);
                ParseContainer(st[nodeName], e, p, styles);
                
                console.log('#ol,#ul', st);
                cnt.push(st);
                break;
            case 'li':
                ParseContainer(cnt, e, p, styles);
                break;
            case 'div':
            case 'p':
            case 'h1':
            case 'h2':
            case 'h3':
            case 'h4':
            case 'h5':
            case 'h6':
                p = CreateParagraph();
                var st = {stack: []};
                st.stack.push(p);
                ComputeStyle(st, styles);
                ParseContainer(st.stack, e, p);

                cnt.push(st);
                break;
            default:
                console.log('#html2pdfmake', 'Parsing for node ' + e.nodeName + ' not found');
                break;
        }
        return p;
    }

    function ParseHtml(cnt, htmlText) {
        var html = $(htmlText.replace(/[\t\n]+/g, ''));
        var p = CreateParagraph();
        for (var i = 0; i < html.length; i++) {
            ParseElement(cnt, html.get(i), p);
        }
    }

    function CreateParagraph() {
        var p = {text: []};
        return p;
    }

};

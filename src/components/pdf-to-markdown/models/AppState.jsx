import CalculateGlobalStats from './transformations/textitem/CalculateGlobalStats.jsx';

import CompactLines from './transformations/lineitem/CompactLines.jsx';
import RemoveRepetitiveElements from './transformations/lineitem/RemoveRepetitiveElements.jsx'
import VerticalToHorizontal from './transformations/lineitem/VerticalToHorizontal.jsx';
import DetectTOC from './transformations/lineitem/DetectTOC.jsx'
import DetectListItems from './transformations/lineitem/DetectListItems.jsx'
import DetectHeaders from './transformations/lineitem/DetectHeaders.jsx'

import GatherBlocks from './transformations/textitemblock/GatherBlocks.jsx'
import DetectCodeQuoteBlocks from './transformations/textitemblock/DetectCodeQuoteBlocks.jsx'
import DetectListLevels from './transformations/textitemblock/DetectListLevels.jsx'
import ToTextBlocks from './transformations/ToTextBlocks.jsx';
import ToMarkdown from './transformations/ToMarkdown.jsx'
import * as pdfjs from "pdfjs-dist";
import Metadata from "./Metadata";
import Page from "./Page";
import TextItem from "./TextItem";
import ParseResult from "./ParseResult";

// Holds the state of the Application
export default class AppState {

    constructor(options) {
        this.metadata = null;
        this.pages = [];
        this.transformations = [
            new CompactLines(),
            new RemoveRepetitiveElements(),
            new VerticalToHorizontal(),
            new DetectTOC(),
            new DetectHeaders(),
            new DetectListItems(),

            new GatherBlocks(),
            new DetectCodeQuoteBlocks(),
            new DetectListLevels(),

            new ToTextBlocks(),
            new ToMarkdown()
        ];
    }

    metadataParsed(metadata) {

        // console.debug(new Metadata(metadata));
        this.setState({

        });
    }

    tranform(fileBuffer: Uint8Array) {
        const fontIds = new Set();
        const fontMap = new Map();
        pdfjs.getDocument({
            data: fileBuffer,
            cMapUrl: 'cmaps/',
            cMapPacked: true
        }).promise.then(function(pdfDocument) { // eslint-disable-line no-undef
            // console.debug(pdfDocument);
            pdfDocument.getMetadata().then(function(metadata) {
                // console.debug(metadata);
                this.metadata = new Metadata(metadata);
            });
            this.pages = [];
            const numPages = pdfDocument.numPages;
            for (var i = 0; i < numPages; i++) {
                this.pages.push(new Page({
                    index: i
                }));
            }
            for (var j = 1; j <= pdfDocument.numPages; j++) {
                pdfDocument.getPage(j).then(function(page) {
                    // console.debug(page);
                    var scale = 1.0;
                    var viewport = page.getViewport({scale: scale});

                    page.getTextContent().then(function(textContent) {
                        // console.debug(textContent);
                        const textItems = textContent.items.map(function(item) {
                            //trigger resolving of fonts
                            const fontId = item.fontName;
                            if (!fontIds.has(fontId) && fontId.startsWith('g_d0')) {
                                pdfDocument._transport.commonObjs.get(fontId, function(font) {
                                    fontMap.set(fontId, font);
                                });
                                fontIds.add(fontId);
                            }

                            const tx = pdfjs.Util.transform( // eslint-disable-line no-undef
                                viewport.transform,
                                item.transform
                            );

                            const fontHeight = Math.sqrt((tx[2] * tx[2]) + (tx[3] * tx[3]));
                            const dividedHeight = item.height / fontHeight;
                            return new TextItem({
                                x: Math.round(item.transform[4]),
                                y: Math.round(item.transform[5]),
                                width: Math.round(item.width),
                                height: Math.round(dividedHeight <= 1 ? item.height : dividedHeight),
                                text: item.str,
                                font: item.fontName
                            });
                        });
                        this.pages[page._pageIndex] = textItems;
                    });
                    page.getOperatorList().then(function() {
                        // do nothing... this is only for triggering the font retrieval
                    });
                });
            }
        });
        this.transformations.unshift(new CalculateGlobalStats(fontMap))
        var parseResult = new ParseResult({
            pages: this.pages
        });
        var lastTransformation;
        this.transformations.forEach(transformation => {
            if (lastTransformation) {
                parseResult = lastTransformation.completeTransform(parseResult);
            }
            parseResult = transformation.transform(parseResult);
            lastTransformation = transformation;
        });

        var text = '';
        parseResult.pages.forEach(page => {
            page.items.forEach(item => {
                text += item + '\n';
            });
        });
        return text;
    }
}

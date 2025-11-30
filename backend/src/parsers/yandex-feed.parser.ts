import * as fs from 'fs';
import * as sax from 'sax';
import { ParsedOffer, ParsedImage } from './types';

export interface ParseResult {
  offers: ParsedOffer[];
  totalParsed: number;
  errors: ParseError[];
  durationMs: number;
}

export interface ParseError {
  offerId: string | null;
  field: string;
  message: string;
}

export class YandexFeedParser {
  private currentOffer: Partial<ParsedOffer> | null = null;
  private elementStack: string[] = [];
  private currentText: string = '';
  private currentImageTag: string | null = null;
  private offers: ParsedOffer[] = [];
  private errors: ParseError[] = [];

  async parse(filePath: string): Promise<ParseResult> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(filePath);
      const parser = sax.createStream(true, { trim: true });

      parser.on('opentag', (node) => this.onOpenTag(node));
      parser.on('closetag', (tagName) => this.onCloseTag(tagName));
      parser.on('text', (text) => this.onText(text));
      parser.on('cdata', (text) => this.onText(text));
      parser.on('error', (err) => {
        this.errors.push({
          offerId: this.currentOffer?.externalId || null,
          field: 'xml',
          message: err.message,
        });
        // Продолжаем парсинг
        (parser as unknown as { resume: () => void }).resume();
      });

      parser.on('end', () => {
        resolve({
          offers: this.offers,
          totalParsed: this.offers.length,
          errors: this.errors,
          durationMs: Date.now() - startTime,
        });
      });

      stream.pipe(parser);
      stream.on('error', reject);
    });
  }

  private onOpenTag(node: sax.Tag): void {
    this.elementStack.push(node.name);
    this.currentText = '';

    if (node.name === 'offer') {
      this.currentOffer = {
        externalId: node.attributes['internal-id'] as string,
        images: [],
        type: 'продажа',
        propertyType: 'жилая',
        category: 'квартира',
        currency: 'RUR',
        isStudio: false,
        mortgage: false,
        rooms: 0,
        areaTotal: 0,
        areaLiving: null,
        areaKitchen: null,
        floor: 1,
        floorsTotal: 1,
        price: 0,
        latitude: 0,
        longitude: 0,
        buildingName: '',
        address: '',
      };
    }

    if (node.name === 'image' && this.currentOffer) {
      this.currentImageTag = (node.attributes['tag'] as string) || null;
    }
  }

  private onCloseTag(tagName: string): void {
    const text = this.currentText.trim();
    const parentElement = this.elementStack.length > 1 ? this.elementStack[this.elementStack.length - 2] : null;

    if (this.currentOffer) {
      switch (tagName) {
        // Основные поля
        case 'type':
          this.currentOffer.type = text;
          break;
        case 'property-type':
          this.currentOffer.propertyType = text;
          break;
        case 'category':
          this.currentOffer.category = text;
          break;

        // Характеристики
        case 'rooms':
          this.currentOffer.rooms = parseInt(text, 10) || 0;
          this.currentOffer.isStudio = this.currentOffer.rooms === 0;
          break;
        case 'studio':
          if (text === 'true' || text === '1') {
            this.currentOffer.isStudio = true;
            this.currentOffer.rooms = 0;
          }
          break;
        case 'floor':
          this.currentOffer.floor = parseInt(text, 10) || 1;
          break;
        case 'floors-total':
          this.currentOffer.floorsTotal = parseInt(text, 10) || 1;
          break;
        case 'renovation':
          this.currentOffer.renovation = text || null;
          break;
        case 'balcony':
          this.currentOffer.balcony = text || null;
          break;
        case 'bathroom-unit':
          this.currentOffer.bathroomUnit = text || null;
          break;

        // Площади и цена (через <value>)
        case 'value':
          if (parentElement === 'area') {
            this.currentOffer.areaTotal = parseFloat(text) || 0;
          } else if (parentElement === 'living-space') {
            this.currentOffer.areaLiving = parseFloat(text) || null;
          } else if (parentElement === 'kitchen-space') {
            this.currentOffer.areaKitchen = parseFloat(text) || null;
          } else if (parentElement === 'price') {
            this.currentOffer.price = parseFloat(text) || 0;
          }
          break;

        case 'mortgage':
          this.currentOffer.mortgage = text === 'true' || text === '1';
          break;

        // Здание
        case 'building-name':
          this.currentOffer.buildingName = text || '';
          break;
        case 'building-type':
          this.currentOffer.buildingType = text || null;
          break;
        case 'building-state':
          this.currentOffer.buildingState = (text as 'unfinished' | 'hand-over') || null;
          break;
        case 'built-year':
          this.currentOffer.builtYear = parseInt(text, 10) || null;
          break;
        case 'ready-quarter':
          this.currentOffer.readyQuarter = parseInt(text, 10) || null;
          break;
        case 'nmarket-building-id':
          this.currentOffer.nmarketBuildingId = text || null;
          break;
        case 'nmarket-complex-id':
          this.currentOffer.nmarketComplexId = text || null;
          break;

        // Локация
        case 'address':
          this.currentOffer.address = text || '';
          break;
        case 'district':
          this.currentOffer.district = text || null;
          break;
        case 'latitude':
          this.currentOffer.latitude = parseFloat(text) || 0;
          break;
        case 'longitude':
          this.currentOffer.longitude = parseFloat(text) || 0;
          break;

        // Метро
        case 'name':
          if (parentElement === 'metro') {
            this.currentOffer.metroName = text || null;
          }
          break;
        case 'time-on-foot':
          this.currentOffer.metroTimeOnFoot = parseInt(text, 10) || null;
          break;

        // Контакты
        case 'phone':
          if (parentElement === 'sales-agent') {
            this.currentOffer.salesAgentPhone = text || null;
          }
          break;
        case 'email':
          if (parentElement === 'sales-agent') {
            this.currentOffer.salesAgentEmail = text?.trim() || null;
          }
          break;
        case 'organization':
          if (parentElement === 'sales-agent') {
            this.currentOffer.salesAgentOrganization = text || null;
          }
          break;

        // Описание
        case 'description':
          this.currentOffer.description = text || null;
          break;

        // Даты
        case 'creation-date':
          this.currentOffer.creationDate = text ? new Date(text) : null;
          break;
        case 'last-update-date':
          this.currentOffer.lastUpdateDate = text ? new Date(text) : null;
          break;

        // Изображение
        case 'image':
          if (text && this.currentOffer.images) {
            this.currentOffer.images.push({
              tag: this.currentImageTag as ParsedImage['tag'],
              url: text,
            });
          }
          this.currentImageTag = null;
          break;

        // Завершение offer
        case 'offer':
          if (this.isValidOffer(this.currentOffer)) {
            this.offers.push(this.currentOffer as ParsedOffer);
          } else {
            this.errors.push({
              offerId: this.currentOffer.externalId || null,
              field: 'validation',
              message: 'Invalid offer: missing required fields',
            });
          }
          this.currentOffer = null;
          break;
      }
    }

    this.elementStack.pop();
    this.currentText = '';
  }

  private onText(text: string): void {
    this.currentText += text;
  }

  private isValidOffer(offer: Partial<ParsedOffer>): boolean {
    return !!(
      offer.externalId &&
      offer.buildingName &&
      offer.areaTotal &&
      offer.areaTotal > 0 &&
      offer.price &&
      offer.price > 0 &&
      offer.latitude &&
      offer.longitude
    );
  }
}

export const yandexFeedParser = new YandexFeedParser();

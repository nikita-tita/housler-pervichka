import * as fs from 'fs';
import * as sax from 'sax';
import { ParsedOffer, ParseResult, ParseError } from './types';

interface SaxTag {
  name: string;
  attributes: { [key: string]: string };
}

export class YandexFeedParser {
  private currentOffer: Partial<ParsedOffer> | null = null;
  private elementStack: string[] = []; // Стек элементов для контекста
  private currentText: string = '';
  private currentImageTag: string | null = null;
  private offers: ParsedOffer[] = [];
  private errors: ParseError[] = [];

  async parse(filePath: string): Promise<ParseResult> {
    // Сбрасываем состояние
    this.offers = [];
    this.errors = [];
    this.elementStack = [];

    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(filePath);
      const parser = sax.createStream(true, { trim: true });

      parser.on('opentag', (node) => this.onOpenTag(node as SaxTag));
      parser.on('closetag', (tagName) => this.onCloseTag(tagName));
      parser.on('text', (text) => this.onText(text));
      parser.on('error', (err) => {
        this.errors.push({
          offerId: this.currentOffer?.externalId || null,
          field: 'xml',
          message: err.message,
        });
        parser.resume();
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

  private getParentElement(): string | null {
    return this.elementStack.length > 1
      ? this.elementStack[this.elementStack.length - 2]
      : null;
  }

  private onOpenTag(node: SaxTag): void {
    this.elementStack.push(node.name);
    this.currentText = '';

    if (node.name === 'offer') {
      this.currentOffer = {
        externalId: node.attributes['internal-id'],
        images: [],
        type: 'продажа',
        propertyType: 'жилая',
        category: 'квартира',
        currency: 'RUR',
        isStudio: false,
        mortgage: false,
        rooms: 0,
        areaTotal: 0,
        floor: 1,
        floorsTotal: 1,
        price: 0,
        latitude: 0,
        longitude: 0,
      };
    }

    if (node.name === 'image' && this.currentOffer) {
      this.currentImageTag = node.attributes['tag'] || null;
    }
  }

  private onCloseTag(tagName: string): void {
    const text = this.currentText.trim();
    const parent = this.getParentElement();

    this.elementStack.pop();

    if (!this.currentOffer) return;

    // Обрабатываем с учётом родительского элемента
    switch (tagName) {
      // Значения с родителем
      case 'value':
        if (parent === 'area') {
          this.currentOffer.areaTotal = parseFloat(text) || 0;
        } else if (parent === 'living-space') {
          this.currentOffer.areaLiving = parseFloat(text) || null;
        } else if (parent === 'kitchen-space') {
          this.currentOffer.areaKitchen = parseFloat(text) || null;
        } else if (parent === 'price') {
          this.currentOffer.price = parseFloat(text) || 0;
        }
        break;

      case 'name':
        if (parent === 'metro') {
          this.currentOffer.metroName = text || null;
        }
        // sales-agent/name игнорируем
        break;

      // Прямые поля (без вложенности)
      case 'type':
        this.currentOffer.type = text;
        break;
      case 'property-type':
        this.currentOffer.propertyType = text;
        break;
      case 'category':
        this.currentOffer.category = text;
        break;
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
      case 'ceiling-height':
        this.currentOffer.ceilingHeight = parseFloat(text) || null;
        break;
      case 'mortgage':
        this.currentOffer.mortgage = text === 'true' || text === '1';
        break;

      // Здание
      case 'building-name':
        this.currentOffer.buildingName = text || null;
        break;
      case 'building-type':
        this.currentOffer.buildingType = text || null;
        break;
      case 'building-state':
        this.currentOffer.buildingState = text || null;
        break;
      case 'built-year':
        this.currentOffer.builtYear = parseInt(text, 10) || null;
        break;
      case 'ready-quarter':
        this.currentOffer.readyQuarter = parseInt(text, 10) || null;
        break;
      case 'nmarket-building-id':
        this.currentOffer.nmarketBuildingId = parseInt(text, 10) || null;
        break;
      case 'nmarket-complex-id':
        this.currentOffer.nmarketComplexId = parseInt(text, 10) || null;
        break;

      // Локация
      case 'address':
        this.currentOffer.address = text || null;
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

      // Метро (вложенные в metro)
      case 'time-on-foot':
        if (parent === 'metro') {
          this.currentOffer.metroTimeOnFoot = parseInt(text, 10) || null;
        }
        break;
      case 'time-on-transport':
        if (parent === 'metro') {
          this.currentOffer.metroTimeOnTransport = parseInt(text, 10) || null;
        }
        break;

      // Контакты (вложенные в sales-agent)
      case 'phone':
        if (parent === 'sales-agent') {
          this.currentOffer.salesAgentPhone = text || null;
        }
        break;
      case 'email':
        if (parent === 'sales-agent') {
          this.currentOffer.salesAgentEmail = text?.trim() || null;
        }
        break;
      case 'organization':
        if (parent === 'sales-agent') {
          this.currentOffer.salesAgentOrganization = text || null;
        }
        break;
      case 'sales-agent-category':
        this.currentOffer.salesAgentCategory = text || null;
        break;

      // Описание
      case 'description':
        this.currentOffer.description = text || null;
        break;

      // Изображение
      case 'image':
        if (text && this.currentOffer.images) {
          this.currentOffer.images.push({
            tag: this.currentImageTag,
            url: text,
          });
        }
        this.currentImageTag = null;
        break;

      // Даты
      case 'creation-date':
        this.currentOffer.creationDate = text ? new Date(text) : null;
        break;
      case 'last-update-date':
        this.currentOffer.lastUpdateDate = text ? new Date(text) : null;
        break;

      // Конец offer
      case 'offer':
        if (this.currentOffer && this.validateOffer(this.currentOffer)) {
          this.offers.push(this.currentOffer as ParsedOffer);
        }
        this.currentOffer = null;
        break;
    }
  }

  private onText(text: string): void {
    this.currentText += text;
  }

  private validateOffer(offer: Partial<ParsedOffer>): boolean {
    const errors: ParseError[] = [];

    if (!offer.externalId) {
      errors.push({ offerId: null, field: 'externalId', message: 'Missing internal-id' });
    }
    if (!offer.price || offer.price <= 0) {
      errors.push({ offerId: offer.externalId || null, field: 'price', message: 'Invalid price' });
    }
    if (!offer.areaTotal || offer.areaTotal <= 0) {
      errors.push({ offerId: offer.externalId || null, field: 'areaTotal', message: 'Invalid area' });
    }
    if (!offer.latitude || !offer.longitude) {
      errors.push({
        offerId: offer.externalId || null,
        field: 'coordinates',
        message: 'Missing coordinates',
      });
    }

    if (errors.length > 0) {
      this.errors.push(...errors);
      return false;
    }

    return true;
  }
}

export const feedParser = new YandexFeedParser();

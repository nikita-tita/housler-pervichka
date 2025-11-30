import * as fs from 'fs';
import * as sax from 'sax';
import { ParsedOffer, ParseResult, ParseError } from './types';

interface SaxTag {
  name: string;
  attributes: { [key: string]: string };
}

export class YandexFeedParser {
  private currentOffer: Partial<ParsedOffer> | null = null;
  private currentElement: string = '';
  private currentText: string = '';
  private currentImageTag: string | null = null;
  private offers: ParsedOffer[] = [];
  private errors: ParseError[] = [];

  async parse(filePath: string): Promise<ParseResult> {
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
        // Продолжаем парсинг
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

  private onOpenTag(node: SaxTag): void {
    this.currentElement = node.name;
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
      };
    }

    if (node.name === 'image' && this.currentOffer) {
      this.currentImageTag = (node.attributes['tag'] as string) || null;
    }
  }

  private onCloseTag(tagName: string): void {
    if (!this.currentOffer) return;

    const text = this.currentText.trim();

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
      case 'ceiling-height':
        this.currentOffer.ceilingHeight = parseFloat(text) || null;
        break;

      // Площади (внутри <area>, <living-space>, <kitchen-space>)
      case 'value':
        if (this.currentElement === 'value') {
          // Определяем родительский элемент по контексту
          // Это упрощение — в реальности нужен стек элементов
        }
        break;
      case 'area':
        // Площадь приходит как вложенный <value>
        break;

      // Цена
      case 'price':
        // Цена тоже как вложенный <value>
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

      // Метро
      case 'name':
        // Может быть имя метро или имя агента
        // Нужен стек для правильного определения
        break;
      case 'time-on-foot':
        this.currentOffer.metroTimeOnFoot = parseInt(text, 10) || null;
        break;
      case 'time-on-transport':
        this.currentOffer.metroTimeOnTransport = parseInt(text, 10) || null;
        break;

      // Контакты
      case 'phone':
        this.currentOffer.salesAgentPhone = text || null;
        break;
      case 'email':
        this.currentOffer.salesAgentEmail = text?.trim() || null;
        break;
      case 'organization':
        this.currentOffer.salesAgentOrganization = text || null;
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
    // Минимальная валидация
    if (!offer.externalId) {
      this.errors.push({
        offerId: null,
        field: 'externalId',
        message: 'Missing internal-id',
      });
      return false;
    }

    if (!offer.price || offer.price <= 0) {
      // Попробуем извлечь цену из других полей
      this.errors.push({
        offerId: offer.externalId,
        field: 'price',
        message: 'Invalid or missing price',
      });
      return false;
    }

    if (!offer.areaTotal || offer.areaTotal <= 0) {
      this.errors.push({
        offerId: offer.externalId,
        field: 'areaTotal',
        message: 'Invalid or missing area',
      });
      return false;
    }

    return true;
  }
}

export const feedParser = new YandexFeedParser();

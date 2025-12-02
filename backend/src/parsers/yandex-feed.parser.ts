import * as sax from 'sax';
import * as fs from 'fs';

export interface ParsedOffer {
  external_id: string;
  type: string;
  property_type: string;
  category: string;
  rooms: number;
  studio: boolean;
  floor: number;
  floors_total: number;
  area_total: number;
  area_living: number | null;
  area_kitchen: number | null;
  ceiling_height: number | null;
  price: number;
  renovation: string | null;
  balcony: string | null;
  bathroom_unit: string | null;
  building_name: string | null;
  building_type: string | null;
  building_state: string | null;
  built_year: number | null;
  ready_quarter: number | null;
  address: string;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  images: { url: string; tag: string | null }[];
  metro: { name: string; time_on_foot: number | null; time_on_transport: number | null }[];
  sales_agent: {
    phone: string | null;
    email: string | null;
    organization: string | null;
  };
}

export interface ParseResult {
  offers: ParsedOffer[];
  errors: string[];
  stats: {
    total: number;
    parsed: number;
    failed: number;
    duration_ms: number;
  };
}

export class YandexFeedParser {
  private elementStack: string[] = [];
  private currentOffer: Partial<ParsedOffer> | null = null;
  private currentText: string = '';
  private currentImageTag: string | null = null;
  private currentMetro: { name: string; time_on_foot: number | null; time_on_transport: number | null } | null = null;

  async parse(filePath: string): Promise<ParseResult> {
    const startTime = Date.now();
    const offers: ParsedOffer[] = [];
    const errors: string[] = [];

    return new Promise((resolve, reject) => {
      const parser = sax.createStream(true, { trim: true });
      const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });

      parser.on('opentag', (node) => {
        this.elementStack.push(node.name);
        this.currentText = '';

        if (node.name === 'offer') {
          this.currentOffer = {
            external_id: node.attributes['internal-id'] as string || '',
            images: [],
            metro: [],
            sales_agent: { phone: null, email: null, organization: null }
          };
        }

        if (node.name === 'image' && this.currentOffer) {
          this.currentImageTag = node.attributes['tag'] as string || null;
        }

        if (node.name === 'metro' && this.currentOffer) {
          this.currentMetro = { name: '', time_on_foot: null, time_on_transport: null };
        }
      });

      parser.on('text', (text) => {
        this.currentText += text;
      });

      parser.on('cdata', (cdata) => {
        this.currentText += cdata;
      });

      parser.on('closetag', (tagName) => {
        if (this.currentOffer) {
          this.processTag(tagName, this.currentText.trim());
        }

        if (tagName === 'offer' && this.currentOffer) {
          try {
            const offer = this.finalizeOffer(this.currentOffer);
            if (offer) {
              offers.push(offer);
            }
          } catch (err) {
            errors.push(`Error parsing offer ${this.currentOffer.external_id}: ${err}`);
          }
          this.currentOffer = null;
        }

        if (tagName === 'metro' && this.currentMetro && this.currentOffer) {
          if (this.currentMetro.name) {
            this.currentOffer.metro!.push(this.currentMetro);
          }
          this.currentMetro = null;
        }

        this.elementStack.pop();
        this.currentText = '';
      });

      parser.on('error', (err) => {
        errors.push(`Parser error: ${err.message}`);
        // Continue parsing despite errors
        (parser as any).resume();
      });

      parser.on('end', () => {
        resolve({
          offers,
          errors,
          stats: {
            total: offers.length + errors.length,
            parsed: offers.length,
            failed: errors.length,
            duration_ms: Date.now() - startTime
          }
        });
      });

      fileStream.on('error', (err) => {
        reject(new Error(`File read error: ${err.message}`));
      });

      fileStream.pipe(parser);
    });
  }

  private processTag(tagName: string, value: string): void {
    if (!this.currentOffer || !value) return;

    const parent = this.elementStack[this.elementStack.length - 2];

    switch (tagName) {
      case 'type':
        this.currentOffer.type = value;
        break;
      case 'property-type':
        this.currentOffer.property_type = value;
        break;
      case 'category':
        this.currentOffer.category = value;
        break;
      case 'rooms':
        this.currentOffer.rooms = parseInt(value) || 0;
        break;
      case 'studio':
        this.currentOffer.studio = value === '1' || value.toLowerCase() === 'true';
        break;
      case 'floor':
        this.currentOffer.floor = parseInt(value) || 1;
        break;
      case 'floors-total':
        this.currentOffer.floors_total = parseInt(value) || 1;
        break;
      case 'value':
        if (parent === 'area') {
          this.currentOffer.area_total = parseFloat(value) || 0;
        } else if (parent === 'living-space') {
          this.currentOffer.area_living = parseFloat(value) || null;
        } else if (parent === 'kitchen-space') {
          this.currentOffer.area_kitchen = parseFloat(value) || null;
        } else if (parent === 'ceiling-height') {
          this.currentOffer.ceiling_height = parseFloat(value) || null;
        } else if (parent === 'price') {
          this.currentOffer.price = parseInt(value) || 0;
        }
        break;
      case 'ceiling-height':
        // Прямое значение без вложенного <value>
        if (value && !isNaN(parseFloat(value))) {
          this.currentOffer.ceiling_height = parseFloat(value) || null;
        }
        break;
      case 'renovation':
        this.currentOffer.renovation = value;
        break;
      case 'balcony':
        this.currentOffer.balcony = value;
        break;
      case 'bathroom-unit':
        this.currentOffer.bathroom_unit = value;
        break;
      case 'building-name':
        this.currentOffer.building_name = value;
        break;
      case 'building-type':
        this.currentOffer.building_type = value;
        break;
      case 'building-state':
        this.currentOffer.building_state = value;
        break;
      case 'built-year':
        this.currentOffer.built_year = parseInt(value) || null;
        break;
      case 'ready-quarter':
        this.currentOffer.ready_quarter = parseInt(value) || null;
        break;
      case 'address':
        this.currentOffer.address = value;
        break;
      case 'district':
        this.currentOffer.district = value;
        break;
      case 'latitude':
        this.currentOffer.latitude = parseFloat(value) || null;
        break;
      case 'longitude':
        this.currentOffer.longitude = parseFloat(value) || null;
        break;
      case 'description':
        this.currentOffer.description = value;
        break;
      case 'image':
        if (value.startsWith('http')) {
          this.currentOffer.images!.push({
            url: value,
            tag: this.currentImageTag
          });
        }
        this.currentImageTag = null;
        break;
      case 'name':
        if (parent === 'metro' && this.currentMetro) {
          this.currentMetro.name = value;
        }
        break;
      case 'time-on-foot':
        if (this.currentMetro) {
          this.currentMetro.time_on_foot = parseInt(value) || null;
        }
        break;
      case 'time-on-transport':
        if (this.currentMetro) {
          this.currentMetro.time_on_transport = parseInt(value) || null;
        }
        break;
      case 'phone':
        if (parent === 'sales-agent') {
          this.currentOffer.sales_agent!.phone = value.trim();
        }
        break;
      case 'email':
        if (parent === 'sales-agent') {
          this.currentOffer.sales_agent!.email = value.trim();
        }
        break;
      case 'organization':
        if (parent === 'sales-agent') {
          this.currentOffer.sales_agent!.organization = value.trim();
        }
        break;
    }
  }

  private finalizeOffer(partial: Partial<ParsedOffer>): ParsedOffer | null {
    // Validate required fields
    if (!partial.external_id || !partial.address || !partial.price) {
      return null;
    }

    return {
      external_id: partial.external_id,
      type: partial.type || 'продажа',
      property_type: partial.property_type || 'жилая',
      category: partial.category || 'квартира',
      rooms: partial.studio ? 0 : (partial.rooms || 0),
      studio: partial.studio || false,
      floor: partial.floor || 1,
      floors_total: partial.floors_total || 1,
      area_total: partial.area_total || 0,
      area_living: partial.area_living || null,
      area_kitchen: partial.area_kitchen || null,
      ceiling_height: partial.ceiling_height || null,
      price: partial.price,
      renovation: partial.renovation || null,
      balcony: partial.balcony || null,
      bathroom_unit: partial.bathroom_unit || null,
      building_name: partial.building_name || null,
      building_type: partial.building_type || null,
      building_state: partial.building_state || null,
      built_year: partial.built_year || null,
      ready_quarter: partial.ready_quarter || null,
      address: partial.address,
      district: partial.district || null,
      latitude: partial.latitude || null,
      longitude: partial.longitude || null,
      description: partial.description || null,
      images: partial.images || [],
      metro: partial.metro || [],
      sales_agent: partial.sales_agent || { phone: null, email: null, organization: null }
    };
  }
}

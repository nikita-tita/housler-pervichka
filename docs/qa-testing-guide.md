# QA Testing Guide  Housler 5@28G:0

**5@A8O:** 1.4
**0B0:** 03.12.2025
**:@C65=85:** https://agent.housler.ru
**>A;54=55 B5AB8@>20=85:** 03.12.2025

---

## Changelog

### v1.4 (03.12.2025)
- >102;5= 3>AB52>9 8=B5@D59A 4;O :;85=B>2 (Guest Mode)
- >2K5 AB@0=8FK: `/s/[code]`, `/s/[code]/offers`, `/s/[code]/offers/[id]`
- 83@0F8O 009_guest_booking ?@8<5=5=0

### v1.3 (03.12.2025)
- FIX-002: IPv6 rate limiter warning 8A?@02;5=

### v1.2 (03.12.2025)
- FIX-001: #=8D8:0F8O ?>;59 API /favorites

---

## 0. !B0BCA 8A?@02;5=89

| ID | @>1;5<0 | !B0BCA | 0B0 |
|----|----------|--------|------|
| BUG-001 | C1;8G=0O ?>41>@:0 `/s/test-demo-2024` ’ 500 |  A?@02;5=> | 02.12.2025 |
| BUG-002 | CABK5 :0@B>G:8 =0 AB@0=8F5 035=B0 `/selections/:id` |  A?@02;5=> | 02.12.2025 |
| BUG-004 | !B@0=8F0 /favorites ?0405B |  A?@02;5=> | 03.12.2025 |
| FIX-001 | #=8D8:0F8O ?>;59 API /favorites |  A?@02;5=> | 03.12.2025 |
| FIX-002 | IPv6 rate limiter warning |  A?@02;5=> | 03.12.2025 |
| FEAT-001 | >AB52>9 8=B5@D59A 4;O :;85=B>2 |   50;87>20=> | 03.12.2025 |

---

## 1. "5AB>2K5 0::0C=BK

### 1.1 ;85=B (client)
| >;5 | =0G5=85 |
|------|----------|
| Email | `client@test.housler.ru` |
| >4 | `111111` |
|  >;L | `client` |

### 1.2 35=B (agent)
| >;5 | =0G5=85 |
|------|----------|
| Email | `agent@test.housler.ru` |
| >4 | `333333` |
|  >;L | `agent` |

### 1.3 4<8=8AB@0B>@ (admin)
| >;5 | =0G5=85 |
|------|----------|
| Email | `admin@test.housler.ru` |
| >4 | `555555` |
|  >;L | `admin` |

> **:** A5 B5AB>2K5 0::0C=BK 8A?>;L7CNB D>@<C `/login/client` 4;O 2E>40 G5@57 email.

---

## 2. >AB52>9 @568< (Guest Mode)  

### 2.1 ?8A0=85 DC=:F8>=0;0

>ABL (=502B>@87>20==K9 ?>;L7>20B5;L) <>65B:
- @>A<0B@820BL ?5@A>=0;L=CN ?>41>@:C ?> AAK;:5 `/s/[code]`
- A:0BL :20@B8@K 2 :0B0;>35 `/s/[code]/offers`
- !<>B@5BL 45B0;L=CN :0@B>G:C >1J5:B0 `/s/[code]/offers/[id]`
- AB02;OBL 70O2:C =0 ?@>A<>B@ (D>@<0 BookingFormGuest)

### 2.2 "5AB>2K5 40==K5

| 0@0<5B@ | =0G5=85 |
|----------|----------|
| "5AB>20O ?>41>@:0 | `test-demo-2024` |
| URL | https://agent.housler.ru/s/test-demo-2024 |
| 35=B | "5AB>2K9 35=B (agent@test.housler.ru) |
| 35=BAB2> | Housler |

### 2.3 "5AB>2K5 AF5=0@88

#### TC-GUEST-001: @>A<>B@ ?>41>@:8 3>AB5<
| 0@0<5B@ | =0G5=85 |
|----------|----------|
| @8>@8B5B | Critical |
| @54CA;>285 | 502B>@87>20==K9 ?>;L7>20B5;L |

**(038:**
1. B:@KBL https://agent.housler.ru/s/test-demo-2024

**68405<K9 @57C;LB0B:**
- B>1@0605BAO =0720=85 ?>41>@:8 ""5AB>20O ?>41>@:0"
- 84=K :0@B>G:8 :20@B8@
-  E545@5  =0720=85 035=BAB20 8 :=>?:0 ">72>=8BL"
- CTA "A:0BL :20@B8@K" 254QB =0 `/s/test-demo-2024/offers`

---

#### TC-GUEST-002: >8A: :20@B8@ 2 3>AB52>< @568<5
| 0@0<5B@ | =0G5=85 |
|----------|----------|
| @8>@8B5B | High |

**(038:**
1. B:@KBL https://agent.housler.ru/s/test-demo-2024/offers
2. @8<5=8BL D8;LB@K (=0?@8<5@, 2-:><=0B=K5)
3. K1@0BL >1J5:B

**68405<K9 @57C;LB0B:**
- 0B0;>3 >B>1@0605BAO A D8;LB@0<8
-  01>B05B ?038=0F8O 8 A>@B8@>2:0
- ;8: =0 :0@B>G:C 254QB =0 `/s/test-demo-2024/offers/[id]`

---

#### TC-GUEST-003: 0O2:0 =0 ?@>A<>B@
| 0@0<5B@ | =0G5=85 |
|----------|----------|
| @8>@8B5B | Critical |

**(038:**
1. B:@KBL https://agent.housler.ru/s/test-demo-2024/offers/12020
2. 0?>;=8BL D>@<C "AB028BL 70O2:C =0 ?@>A<>B@":
   - <O: "5AB>2K9 ;85=B
   - "5;5D>=: +7 999 123 45 67
3. 060BL "B?@028BL 70O2:C"

**68405<K9 @57C;LB0B:**
- !>>1I5=85 "0O2:0 >B?@02;5=0!"
-   A>740QBAO 70?8AL 2 `bookings` A `source_type = 'guest_from_selection'`

**@>25@:0 2 :**
```bash
ssh housler-server "docker exec agent-postgres psql -U housler -d housler_agent -c \"SELECT id, source_type, guest_client_id, source_selection_code FROM bookings ORDER BY id DESC LIMIT 1\""
```

---

### 2.4 API ?@>25@:8

```bash
# >=B5:AB ?>41>@:8 (035=B, 035=BAB2>)
curl -s "https://agent.housler.ru/api/selections/shared/test-demo-2024/context" | jq '.'

# >AB52>5 1@>=8@>20=85
curl -X POST "https://agent.housler.ru/api/bookings/guest" \
  -H "Content-Type: application/json" \
  -d '{
    "offerId": 12020,
    "clientName": ""5AB",
    "clientPhone": "+79991234567",
    "guestClientId": "test-uuid-123",
    "sourceSelectionCode": "test-demo-2024"
  }'
```

---

## 3. @8B8G5A:85 AF5=0@88 (Smoke Test)

### 3.1 2B>@870F8O

#### TC-AUTH-001: E>4 :;85=B0
**(038:**
1. B:@KBL https://agent.housler.ru/login
2. 25AB8 email: `client@test.housler.ru`
3. 060BL "# <5=O 5ABL ?>AB>O==K9 :>4"
4. 25AB8 :>4: `111111`
5. 060BL ">9B8"

**68405<K9 @57C;LB0B:**
-  548@5:B =0 3;02=CN
-  header ?>O2;O5BAO 020B0@

---

### 3.2 71@0==>5

#### TC-FAV-001: @>A<>B@ 871@0==>3>
**URL:** https://agent.housler.ru/favorites

**68405<K9 @57C;LB0B:**
- !B@0=8F0 703@C605BAO 157 >H81>:
- 0@B>G:8 A F5=>9, ?;>I04LN, 

---

### 3.3 >41>@:8 035=B0

#### TC-SEL-001: @>A<>B@ ?>41>@:8 035=B><
**@54CA;>285:** 2B>@87>20= :0: agent@test.housler.ru

**(038:**
1. B:@KBL https://agent.housler.ru/selections
2. K1@0BL ""5AB>20O ?>41>@:0"

**68405<K9 @57C;LB0B:**
- B>1@060NBAO >1J5:BK 2 ?>41>@:5
- ABL AAK;:0 4;O :;85=B0 (share_code)

---

## 4. @>25@:0 ;>3>2

```bash
# >38 backend (4>;6=> 1KBL G8AB>):
ssh housler-server "docker logs agent-backend --tail 20 2>&1"

# @>25@:0 =0 >H81:8:
ssh housler-server "docker logs agent-backend --tail 50 2>&1 | grep -i 'error\|warning'"
```

---

## 5. '5:;8AB ?5@54 @5;87><

- [ ] TC-GUEST-001: >AB520O ?>41>@:0 >B:@K205BAO
- [ ] TC-GUEST-002: 0B0;>3 2 3>AB52>< @568<5 @01>B05B
- [ ] TC-GUEST-003: 0O2:0 =0 ?@>A<>B@ >B?@02;O5BAO
- [ ] TC-AUTH-001: 2B>@870F8O :;85=B0 @01>B05B
- [ ] TC-FAV-001: 71@0==>5 >B>1@0605BAO
- [ ] TC-SEL-001: >41>@:8 035=B0 @01>B0NB
- [ ] >38 backend: =5B >H81>:
- [ ] Regression: @0=55 8A?@02;5==K5 1038 =5 2>A?@>872>4OBAO

---

*>:C<5=B >1=>2;Q=: 03.12.2025*

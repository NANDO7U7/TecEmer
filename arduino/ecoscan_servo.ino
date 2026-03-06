/*
 * ============================================
 * EcoScan AI UGB — Arduino Servo Controller
 * ============================================
 * 
 * Universidad Gerardo Barrios
 * Proyecto: Tecnología Emergente
 * 
 * Recibe comandos por Serial desde la Web App
 * y abre la compuerta correspondiente:
 * 
 *   'P' → Servo 1 (Verde - Plástico)
 *   'L' → Servo 2 (Amarillo - Latas)
 *   'C' → Servo 3 (Negro - Basura Común)
 * 
 * Hardware:
 *   - Arduino UNO / Nano
 *   - 3x Servomotores SG90
 *   - Alimentación externa 5V para servos
 * 
 * Conexiones:
 *   Servo 1 (Verde)    → Pin 9
 *   Servo 2 (Amarillo) → Pin 10
 *   Servo 3 (Negro)    → Pin 11
 * 
 * Baudrate: 9600
 */

#include <Servo.h>

// ===== CONFIGURACIÓN DE PINES =====
#define SERVO_PLASTICO_PIN  9   // Verde
#define SERVO_LATA_PIN      10  // Amarillo
#define SERVO_COMUN_PIN     11  // Negro

// ===== CONFIGURACIÓN DE TIEMPOS =====
#define OPEN_ANGLE    90    // Ángulo de apertura (grados)
#define CLOSED_ANGLE  0     // Ángulo de cierre (grados)
#define OPEN_TIME     3000  // Tiempo abierto (ms)

// ===== OBJETOS SERVO =====
Servo servoPlastico;
Servo servoLata;
Servo servoComun;

// ===== LED INDICADOR (opcional) =====
#define LED_PIN 13

void setup() {
  // Iniciar comunicación serial
  Serial.begin(9600);
  
  // Adjuntar servos a pines
  servoPlastico.attach(SERVO_PLASTICO_PIN);
  servoLata.attach(SERVO_LATA_PIN);
  servoComun.attach(SERVO_COMUN_PIN);
  
  // Posición inicial: cerrado
  servoPlastico.write(CLOSED_ANGLE);
  servoLata.write(CLOSED_ANGLE);
  servoComun.write(CLOSED_ANGLE);
  
  // LED indicador
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  
  // Mensaje de inicio
  Serial.println("EcoScan AI UGB - Arduino Ready");
  Serial.println("Comandos: P (Plastico), L (Lata), C (Comun)");
  Serial.println("-------------------------------------------");
}

void loop() {
  if (Serial.available() > 0) {
    char command = Serial.read();
    
    switch (command) {
      case 'P':
      case 'p':
        Serial.println(">> VERDE: Abriendo compuerta Plastico...");
        openGate(servoPlastico, "Plastico");
        break;
        
      case 'L':
      case 'l':
        Serial.println(">> AMARILLO: Abriendo compuerta Latas...");
        openGate(servoLata, "Lata");
        break;
        
      case 'C':
      case 'c':
        Serial.println(">> NEGRO: Abriendo compuerta Comun...");
        openGate(servoComun, "Comun");
        break;
        
      default:
        // Ignorar caracteres no reconocidos (\n, \r, etc.)
        break;
    }
  }
}

/**
 * Abre una compuerta por OPEN_TIME milisegundos y luego la cierra.
 * Enciende el LED durante la apertura como indicador visual.
 */
void openGate(Servo &servo, const char* name) {
  // Encender LED
  digitalWrite(LED_PIN, HIGH);
  
  // Abrir compuerta
  servo.write(OPEN_ANGLE);
  Serial.print("   Compuerta ");
  Serial.print(name);
  Serial.println(" ABIERTA");
  
  // Mantener abierta
  delay(OPEN_TIME);
  
  // Cerrar compuerta
  servo.write(CLOSED_ANGLE);
  Serial.print("   Compuerta ");
  Serial.print(name);
  Serial.println(" CERRADA");
  
  // Apagar LED
  digitalWrite(LED_PIN, LOW);
  
  Serial.println("-------------------------------------------");
}

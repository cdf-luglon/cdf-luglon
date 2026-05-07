<?php
// Configuration des accès à la base de données
$host = "db5020338865.hosting-data.io"; // Ton hôte IONOS
$dbname = "dbs15618331";               // Ton nom de base
$user = "dbu284020";                   // Ton nom d'utilisateur
$pass = "Fitdej-woknex-rachu8";        // Ton mot de passe 

header('Content-Type: application/json');

try {
    // 1. Connexion à la base de données
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 2. RÉCUPÉRATION ET NETTOYAGE DES DONNÉES
    // On force le type (int) pour les compteurs et (float) pour le prix
    $nom = $_POST['Nom'] ?? '';
    $email = $_POST['Email'] ?? '';
    $tel = $_POST['Telephone'] ?? '';
    $nb = (int)($_POST['NbPersonnes'] ?? 0);
    $soir = $_POST['Soir'] ?? '';
    $viande = (int)($_POST['Viande'] ?? 0);
    $poisson = (int)($_POST['Poisson'] ?? 0);
    $enfant = (int)($_POST['Enfant'] ?? 0);
    $notes = $_POST['Notes'] ?? '';
    $total = (float)($_POST['Total_Euros'] ?? 0);

    // 3. INSERTION DANS LA BASE DE DONNÉES
    $sql = "INSERT INTO reservations (nom, email, telephone, nb_personnes, soir, viande, poisson, enfant, notes, total_euros) 
            VALUES (:nom, :email, :tel, :nb, :soir, :viande, :poisson, :enfant, :notes, :total)";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':nom' => $nom,
        ':email' => $email,
        ':tel' => $tel,
        ':nb' => $nb,
        ':soir' => $soir,
        ':viande' => $viande,
        ':poisson' => $poisson,
        ':enfant' => $enfant,
        ':notes' => $notes,
        ':total' => $total
    ]);

    // 4. ENVOI DE L'E-MAIL DE CONFIRMATION
    if (!empty($email) && filter_var($email, FILTER_VALIDATE_EMAIL)) {
        
        $expediteur = "sh-IfFEvPtpS6S-dvonfDYoMg@eu.hosting-webspace.io"; // Doit exister sur ton interface IONOS
        $nom_affichage = "Comite des Fetes de Luglon";
        
        // Encodage propre du sujet pour que l'émoji ✅ passe les filtres anti-spam
        $subject = "=?UTF-8?B?".base64_encode("✅ Confirmation de votre réservation - Luglon")."?=";
        
        // Entêtes sous forme de tableau (Format moderne et plus fiable pour IONOS)
        $headers = [
            'MIME-Version' => '1.0',
            'Content-type' => 'text/html; charset=utf-8',
            'From' => "$nom_affichage <$expediteur>",
            'Reply-To' => $expediteur,
            'X-Mailer' => 'PHP/' . phpversion()
        ];

        // Corps du mail en HTML avec style intégré
        $message_html = "
        <html>
        <body style='font-family: Arial, sans-serif; color: #333;'>
          <div style='border: 1px solid #ddd; padding: 20px; border-radius: 10px; max-width: 600px;'>
            <h2>Bonjour $nom,</h2>
            <p>Votre réservation pour le repas du <strong>$soir</strong> est bien enregistrée.</p>
            <p><strong>Détail de votre commande :</strong></p>
            <ul>
                <li>Menu Viande : $viande</li>
                <li>Menu Poisson : $poisson</li>
                <li>Menu Enfant : $enfant</li>
            </ul>
            <p>Nombre total de personnes : $nb</p>
            <p style='font-size: 1.2em; color: #27ae60; font-weight: bold;'>Total à régler sur place : $total €</p>
            <hr>
            <p><em>Notes : " . ($notes ? htmlspecialchars($notes) : "Aucune") . "</em></p>
            <p>À très bientôt pour les fêtes !<br>L'équipe du Comité des Fêtes de Luglon</p>
          </div>
        </body>
        </html>
        ";

        // L'envoi avec le paramètre -f pour éviter le blocage par l'hébergeur
        $success_mail = mail($email, $subject, $message_html, $headers, "-f" . $expediteur);
        
        // Petit journal des erreurs : si le mail échoue, ça créera un fichier 'mail_error.log' sur ton serveur
        if(!$success_mail) {
            file_put_contents('mail_error.log', date('Y-m-d H:i:s') . " - Echec envoi vers $email\n", FILE_APPEND);
        }
    }

    // 5. RÉPONSE AU JAVASCRIPT
    echo json_encode(["success" => true]);

} catch (PDOException $e) {
    // En cas d'erreur de base de données
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
?>
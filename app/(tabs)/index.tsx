import { Image, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Image source={require('../../assets/logo-frequencia.png')} style={styles.icon} />

      <Text style={styles.title}>Bem-vindo ao App de Registro de Presença!</Text>
      <Text style={styles.subtitle}>Navegue pelas abas abaixo para acessar as funcionalidades.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#E6F0FF', // azul claro, mesmo da tela de frequência
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#003B73', // azul escuro
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#003B73', // azul escuro para manter consistência
  },
  icon: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, // para deixar a imagem circular
    alignSelf: 'center', 
    marginBottom: 16 
  },
});

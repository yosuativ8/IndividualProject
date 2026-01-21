export default function Home({ places }) {
  return (
    <div>
      <h1>Welcome to the Home Page</h1>
      <ul>
        {places.map((place) => (
          <li key={place.id}>{place.name}</li>
        ))}
      </ul>
    </div>
  );
}